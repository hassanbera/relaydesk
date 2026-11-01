import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
const base = process.env.TEST_API!;
const password = process.env.SEED_PASSWORD!;
assert.match(
  new URL(process.env.DATABASE_URL!).pathname,
  /^\/relaydesk_test_[a-f0-9]{16}$/,
);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let admin: string,
  agent: string,
  employee: string,
  other: string,
  approver: string,
  reference: any,
  me: any;
async function call(
  path: string,
  cookie?: string,
  method = "GET",
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      "x-relaydesk-request": "1",
      origin: process.env.PUBLIC_ORIGIN!,
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: res.status,
    body: await res.json(),
    cookie: res.headers.get("set-cookie")?.split(";")[0],
    headers: res.headers,
  };
}
async function login(email: string) {
  const r = await call("/auth/login", undefined, "POST", { email, password });
  assert.equal(r.status, 201);
  assert.ok(r.cookie);
  return r.cookie!;
}
async function create(cookie = employee, extra = {}) {
  const r = await call("/tickets", cookie, "POST", {
    title: "Integration ticket " + crypto.randomUUID(),
    description: "A reproducible incident reported by an employee.",
    type: "INCIDENT",
    impact: "MEDIUM",
    urgency: "MEDIUM",
    catalogId: reference.catalog.find((c: any) => c.teamId === me.teamId).id,
    ...extra,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.data;
}
before(async () => {
  admin = await login("admin@relaydesk.test");
  agent = await login("agent@relaydesk.test");
  employee = await login("employee@relaydesk.test");
  other = await login("ayse@relaydesk.test");
  approver = await login("approver@relaydesk.test");
  reference = (await call("/reference", admin)).body.data;
  me = (await call("/auth/me", agent)).body.data;
});
after(async () => {
  await pool.end();
});
test("sessions are HttpOnly, hashed, revocable and origin-protected", async () => {
  assert.equal((await call("/tickets")).status, 401);
  const bad = await call("/auth/login", undefined, "POST", {
    email: "admin@relaydesk.test",
    password: "wrong",
  });
  assert.equal(bad.status, 401);
  assert.equal(
    (
      await call(
        "/auth/login",
        undefined,
        "POST",
        { email: "admin@relaydesk.test", password },
        { origin: "https://untrusted.test" },
      )
    ).status,
    403,
  );
  const res = await call("/auth/login", undefined, "POST", {
    email: "admin@relaydesk.test",
    password,
  });
  assert.match(res.headers.get("set-cookie")!, /HttpOnly/);
  assert.match(res.headers.get("set-cookie")!, /SameSite=Lax/);
  const current = await call("/auth/me", res.cookie);
  assert.equal(current.body.data.passwordHash, undefined);
  const db = await pool.query('SELECT "tokenHash" FROM sessions');
  assert.ok(db.rows.every((r) => !res.cookie!.includes(r.tokenHash)));
  assert.equal(
    (await call("/auth/logout", res.cookie, "POST", {})).status,
    201,
  );
  assert.equal((await call("/auth/me", res.cookie)).status, 401);
});
test("employees can read only their tickets, own assets and published knowledge", async () => {
  const t = await create();
  assert.equal((await call("/tickets/" + t.id, other)).status, 404);
  const list = await call("/tickets?limit=100", employee);
  const self = (await call("/auth/me", employee)).body.data;
  assert.ok(list.body.data.items.every((r: any) => r.requesterId === self.id));
  assert.equal((await call("/changes", employee)).status, 403);
  assert.equal((await call("/settings", employee)).status, 403);
  assert.ok(
    (await call("/assets", employee)).body.data.every(
      (a: any) => a.ownerId === self.id,
    ),
  );
  assert.ok(
    (await call("/articles", employee)).body.data.every(
      (a: any) => a.published,
    ),
  );
});
test("Zod rejects malformed and mass-assigned input; priority is server-derived", async () => {
  assert.equal((await call("/tickets/not-a-uuid", admin)).status, 400);
  assert.equal(
    (await call("/tickets", employee, "POST", { title: "x", role: "ADMIN" }))
      .status,
    400,
  );
  const t = await create(employee, { impact: "HIGH", urgency: "HIGH" });
  assert.equal(t.priority, "P1");
  assert.equal(
    (
      await call("/tickets", employee, "POST", {
        title: "Invalid assignment",
        description: "Description",
        type: "INCIDENT",
        impact: "MEDIUM",
        urgency: "MEDIUM",
        teamId: me.teamId,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/tickets", employee, "POST", {
        title: "Missing service",
        description: "Description",
        type: "REQUEST",
        impact: "LOW",
        urgency: "LOW",
      })
    ).status,
    400,
  );
});
test("state machine, optimistic versions and pending SLA pause are transactional", async () => {
  let t = await create();
  assert.equal(
    (
      await call("/tickets/" + t.id, agent, "PATCH", {
        version: t.version,
        status: "CLOSED",
      })
    ).status,
    409,
  );
  let r = await call("/tickets/" + t.id, agent, "PATCH", {
    version: t.version,
    status: "IN_PROGRESS",
    assigneeId: me.id,
  });
  assert.equal(r.status, 200);
  t = r.body.data;
  assert.ok(t.firstResponseAt);
  assert.equal(
    (
      await call("/tickets/" + t.id, agent, "PATCH", {
        version: 1,
        title: "stale",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("/tickets/" + t.id, agent, "PATCH", {
        version: t.version,
        status: "RESOLVED",
      })
    ).status,
    400,
  );
  t = (
    await call("/tickets/" + t.id, agent, "PATCH", {
      version: t.version,
      status: "PENDING",
    })
  ).body.data;
  const due = +new Date(t.resolutionDueAt);
  await pool.query(
    "UPDATE tickets SET \"pausedAt\"=now()-interval '1 hour' WHERE id=$1",
    [t.id],
  );
  t = (
    await call("/tickets/" + t.id, agent, "PATCH", {
      version: t.version,
      status: "IN_PROGRESS",
    })
  ).body.data;
  assert.ok(+new Date(t.resolutionDueAt) - due >= 3599000);
  t = (
    await call("/tickets/" + t.id, agent, "PATCH", {
      version: t.version,
      status: "RESOLVED",
      resolution: "Verified recovery with the employee.",
    })
  ).body.data;
  t = (
    await call("/tickets/" + t.id, agent, "PATCH", {
      version: t.version,
      status: "CLOSED",
    })
  ).body.data;
  assert.equal(t.status, "CLOSED");
  assert.equal(
    (
      await call("/tickets/" + t.id, agent, "PATCH", {
        version: t.version,
        title: "rewrite closed",
      })
    ).status,
    409,
  );
  assert.equal(
    (await call("/tickets/" + t.id, employee, "POST", {})).status,
    404,
  );
});
test("internal notes never leak to requester and public replies set first-response time", async () => {
  const t = await create();
  assert.equal(
    (
      await call("/tickets/" + t.id + "/comments", employee, "POST", {
        body: "hidden",
        internal: true,
      })
    ).status,
    403,
  );
  await call("/tickets/" + t.id + "/comments", agent, "POST", {
    body: "Private investigation",
    internal: true,
  });
  let detail = (await call("/tickets/" + t.id, employee)).body.data;
  assert.equal(detail.comments.length, 0);
  assert.equal(detail.history.length, 0);
  assert.equal(detail.firstResponseAt, null);
  await call("/tickets/" + t.id + "/comments", agent, "POST", {
    body: "We are investigating.",
    internal: false,
  });
  detail = (await call("/tickets/" + t.id, employee)).body.data;
  assert.equal(detail.comments.length, 1);
  assert.ok(detail.firstResponseAt);
  assert.ok(detail.comments.every((c: any) => !c.internal));
});
test("assignment validates team membership without partially updating the ticket", async () => {
  const t = await create();
  const outside = reference.agents.find(
    (u: any) => u.role === "AGENT" && u.teamId !== t.teamId,
  );
  assert.equal(
    (
      await call("/tickets/" + t.id, agent, "PATCH", {
        version: t.version,
        assigneeId: outside.id,
        status: "IN_PROGRESS",
      })
    ).status,
    400,
  );
  const saved = (await call("/tickets/" + t.id, agent)).body.data;
  assert.equal(saved.version, t.version);
  assert.equal(saved.status, "NEW");
});
test("asset updates require staff, ownership consistency and the current version", async () => {
  const input = {
    name: "Test laptop",
    tag: "QA-" + crypto.randomUUID().slice(0, 8),
    type: "LAPTOP",
    serial: "TEST",
    status: "AVAILABLE",
    ownerId: null,
    location: "Lab",
    notes: "",
  };
  assert.equal((await call("/assets", employee, "POST", input)).status, 403);
  const r = await call("/assets", agent, "POST", input);
  assert.equal(r.status, 201);
  const id = r.body.data.id;
  assert.equal(
    (await call("/assets/" + id, agent, "PUT", { ...input, version: 999 }))
      .status,
    409,
  );
  assert.equal(
    (
      await call("/assets/" + id, agent, "PUT", {
        ...input,
        status: "RETIRED",
        ownerId: me.id,
        version: 1,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/assets/" + id, agent, "PUT", {
        ...input,
        status: "IN_USE",
        ownerId: me.id,
        version: 1,
      })
    ).status,
    200,
  );
  assert.equal((await call("/assets", agent, "POST", input)).status, 409);
});
test("knowledge publication and concurrency are enforced server-side", async () => {
  const input = {
    title: "Test article",
    category: "QA",
    summary: "Test summary",
    body: "Plain text with <script> tags is content, not HTML.",
    published: false,
  };
  const r = await call("/articles", agent, "POST", input);
  assert.equal(r.status, 201);
  const id = r.body.data.id;
  assert.ok(
    !(await call("/articles", employee)).body.data.some(
      (a: any) => a.id === id,
    ),
  );
  assert.equal(
    (
      await call("/articles/" + id, agent, "PUT", {
        ...input,
        published: true,
        version: 1,
      })
    ).status,
    200,
  );
  assert.ok(
    (await call("/articles", employee)).body.data.some((a: any) => a.id === id),
  );
  assert.equal(
    (await call("/articles/" + id, agent, "PUT", { ...input, version: 1 }))
      .status,
    409,
  );
});
test("change approval requires another administrator and valid transitions", async () => {
  const input = {
    title: "Test change",
    description: "Maintenance scope",
    risk: "HIGH",
    reason: "Stability",
    implementation: "Back up, apply, verify",
    rollback: "Restore previous version",
    plannedStart: new Date(Date.now() + 3600000).toISOString(),
    plannedEnd: new Date(Date.now() + 7200000).toISOString(),
    assetId: null,
  };
  let c = (await call("/changes", admin, "POST", input)).body.data;
  let r = await call("/changes/" + c.id + "/status", admin, "PATCH", {
    version: c.version,
    status: "SCHEDULED",
    note: "",
  });
  assert.equal(r.status, 409);
  c = (
    await call("/changes/" + c.id + "/status", admin, "PATCH", {
      version: c.version,
      status: "PENDING_APPROVAL",
      note: "",
    })
  ).body.data;
  assert.equal(
    (
      await call("/changes/" + c.id + "/status", admin, "PATCH", {
        version: c.version,
        status: "APPROVED",
        note: "",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/changes/" + c.id + "/status", agent, "PATCH", {
        version: c.version,
        status: "APPROVED",
        note: "",
      })
    ).status,
    403,
  );
  c = (
    await call("/changes/" + c.id + "/status", approver, "PATCH", {
      version: c.version,
      status: "APPROVED",
      note: "Plan reviewed.",
    })
  ).body.data;
  assert.ok(c.approvedAt);
  c = (
    await call("/changes/" + c.id + "/status", admin, "PATCH", {
      version: c.version,
      status: "SCHEDULED",
      note: "",
    })
  ).body.data;
  assert.equal(
    (
      await call("/changes/" + c.id + "/status", admin, "PATCH", {
        version: c.version,
        status: "IMPLEMENTED",
        note: "",
      })
    ).status,
    400,
  );
  c = (
    await call("/changes/" + c.id + "/status", admin, "PATCH", {
      version: c.version,
      status: "IMPLEMENTED",
      note: "Health checks passed.",
    })
  ).body.data;
  assert.equal(c.status, "IMPLEMENTED");
  assert.ok(c.history.length >= 5);
});
test("SLA policy updates affect future tickets without rewriting current deadlines", async () => {
  const settings = (await call("/settings", admin)).body.data,
    p = settings.policies.find((p: any) => p.priority === "P3");
  const old = await create();
  assert.equal(
    (
      await call("/policies/" + p.id, agent, "PUT", {
        responseMinutes: 30,
        resolutionMinutes: 60,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/policies/" + p.id, admin, "PUT", {
        responseMinutes: 120,
        resolutionMinutes: 30,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/policies/" + p.id, admin, "PUT", {
        responseMinutes: 30,
        resolutionMinutes: 90,
      })
    ).status,
    200,
  );
  const t = await create();
  assert.ok(
    Math.abs(
      +new Date(t.resolutionDueAt) - +new Date(t.createdAt) - 90 * 60000,
    ) < 2000,
  );
  assert.equal(
    (await call("/tickets/" + old.id, admin)).body.data.resolutionDueAt,
    old.resolutionDueAt,
  );
});
test("disabling a user revokes sessions and an administrator cannot lock themselves out", async () => {
  const r = await call("/users", admin, "POST", {
    name: "Disabled user",
    email: "disabled@relaydesk.test",
    role: "REQUESTER",
    teamId: null,
    password,
  });
  assert.equal(r.status, 201);
  const cookie = await login("disabled@relaydesk.test");
  assert.equal(
    (
      await call("/users/" + r.body.data.id, admin, "PUT", {
        name: "Disabled user",
        role: "REQUESTER",
        teamId: null,
        active: false,
      })
    ).status,
    200,
  );
  assert.equal((await call("/auth/me", cookie)).status, 401);
  const self = (await call("/auth/me", admin)).body.data;
  assert.equal(
    (
      await call("/users/" + self.id, admin, "PUT", {
        name: self.name,
        role: "REQUESTER",
        teamId: null,
        active: true,
      })
    ).status,
    409,
  );
});
test("queue paging, filters and aggregates agree with database-backed records", async () => {
  const a = await call("/tickets?limit=2&page=1", admin),
    b = await call("/tickets?limit=2&page=2", admin);
  assert.equal(a.body.data.items.length, 2);
  assert.equal(b.body.data.items.length, 2);
  assert.ok(
    !a.body.data.items.some((x: any) =>
      b.body.data.items.some((y: any) => x.id === y.id),
    ),
  );
  const filtered = await call("/tickets?status=NEW&priority=P1", admin);
  assert.ok(
    filtered.body.data.items.every(
      (t: any) => t.status === "NEW" && t.priority === "P1",
    ),
  );
  assert.equal(
    (await call("/tickets?q=" + encodeURIComponent("' OR 1=1 --"), employee))
      .body.data.total,
    0,
  );
  const d = (await call("/dashboard", admin)).body.data;
  const count = await pool.query(
    "SELECT count(*)::int AS n FROM tickets WHERE status NOT IN ('RESOLVED','CLOSED')",
  );
  assert.equal(d.open, count.rows[0].n);
  assert.equal(d.daily.length, 7);
});
