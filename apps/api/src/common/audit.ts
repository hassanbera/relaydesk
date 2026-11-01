import { EntityManager } from "typeorm";
import { AuditEvent } from "../model/entities";
export function audit(
  manager: EntityManager,
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  const r = manager.getRepository(AuditEvent);
  return r.save(r.create({ actorId, entityType, entityId, action, details }));
}
