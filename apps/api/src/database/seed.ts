import { dataSource } from "./data-source";
import {
  User,
  Team,
  Catalog,
  Asset,
  Article,
  Ticket,
  Comment,
  Change,
  SlaPolicy,
} from "../model/entities";
import { hashPassword } from "../auth/password";
import { priorityFor } from "@relaydesk/contracts";
import { audit } from "../common/audit";
async function seed() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production.");
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      "Set SEED_PASSWORD with at least 12 characters in root .env.",
    );
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (m) => {
      if (await m.getRepository(User).count()) {
        console.log("Existing users found; demo records were left unchanged.");
        return;
      }
      const save = <
        T extends
          Team | User | Catalog | Asset | Article | Ticket | Comment | Change,
      >(
        entity: new () => T,
        data: Partial<T>,
      ) => m.getRepository(entity).save(Object.assign(new entity(), data));
      const service = await save(Team, {
        name: "BT Servis Masası",
        description: "Çalışan talepleri, erişim ve cihaz desteği",
      });
      const infra = await save(Team, {
        name: "Altyapı ve Ağ",
        description: "Ağ, sunucu ve güvenlik operasyonları",
      });
      const apps = await save(Team, {
        name: "İş Uygulamaları",
        description: "Kurumsal uygulamalar ve entegrasyonlar",
      });
      const hash = await hashPassword(password);
      const admin = await save(User, {
        name: "Ada Yalın",
        email: "admin@relaydesk.test",
        role: "ADMIN",
        teamId: service.id,
        passwordHash: hash,
        active: true,
      });
      const approver = await save(User, {
        name: "Eren Aydın",
        email: "approver@relaydesk.test",
        role: "ADMIN",
        teamId: infra.id,
        passwordHash: hash,
        active: true,
      });
      const maya = await save(User, {
        name: "Maya Demir",
        email: "agent@relaydesk.test",
        role: "AGENT",
        teamId: service.id,
        passwordHash: hash,
        active: true,
      });
      const can = await save(User, {
        name: "Can Aksoy",
        email: "can@relaydesk.test",
        role: "AGENT",
        teamId: infra.id,
        passwordHash: hash,
        active: true,
      });
      const ece = await save(User, {
        name: "Ece Aras",
        email: "ece@relaydesk.test",
        role: "AGENT",
        teamId: apps.id,
        passwordHash: hash,
        active: true,
      });
      const deniz = await save(User, {
        name: "Deniz Kaya",
        email: "employee@relaydesk.test",
        role: "REQUESTER",
        teamId: null,
        passwordHash: hash,
        active: true,
      });
      const ayse = await save(User, {
        name: "Ayşe Güneş",
        email: "ayse@relaydesk.test",
        role: "REQUESTER",
        teamId: null,
        passwordHash: hash,
        active: true,
      });
      const catalogs = [];
      for (const [name, description, category, teamId] of [
        [
          "Erişim ve yetki",
          "Hesap, uygulama veya klasör erişimi talep edin.",
          "Erişim",
          service.id,
        ],
        [
          "Cihaz ve donanım",
          "Bilgisayar ve çevre birimleri için destek alın.",
          "Donanım",
          service.id,
        ],
        [
          "Ağ ve bağlantı",
          "VPN, kablosuz ağ veya bağlantı sorununu bildirin.",
          "Ağ",
          infra.id,
        ],
        [
          "Kurumsal uygulama",
          "İş uygulamaları ve entegrasyonlara ilişkin talep açın.",
          "Uygulama",
          apps.id,
        ],
      ])
        catalogs.push(
          await save(Catalog, {
            name,
            description,
            category,
            teamId,
            active: true,
          }),
        );
      const assets = [];
      for (const [name, tag, type, ownerId, status, location] of [
        [
          "ThinkPad T14 Gen 5",
          "IT-LT-0142",
          "LAPTOP",
          deniz.id,
          "IN_USE",
          "Ankara · Merkez",
        ],
        [
          "Dell Latitude 5450",
          "IT-LT-0158",
          "LAPTOP",
          ayse.id,
          "IN_USE",
          "Ankara · Merkez",
        ],
        [
          "Uygulama sunucusu 02",
          "IT-SRV-002",
          "SERVER",
          can.id,
          "IN_USE",
          "Veri merkezi",
        ],
        [
          "Kablosuz ağ denetleyicisi",
          "IT-NET-011",
          "NETWORK",
          null,
          "IN_USE",
          "Merkez · Sistem odası",
        ],
        [
          "MacBook Air M3",
          "IT-LT-0164",
          "LAPTOP",
          null,
          "AVAILABLE",
          "BT deposu",
        ],
        [
          "Lisans yönetim paketi",
          "IT-SW-008",
          "SOFTWARE",
          ece.id,
          "IN_USE",
          "Bulut",
        ],
      ] as const)
        assets.push(
          await save(Asset, {
            name,
            tag,
            type,
            ownerId,
            status,
            location,
            serial: "DEMO-" + tag,
            notes: "Kurgusal örnek envanter kaydı.",
            version: 1,
          }),
        );
      const articles: [string, string, string, string, boolean][] = [
        [
          "VPN bağlantısını yeniden kurma",
          "Ağ",
          "VPN bağlantısı başarısız olduğunda izlenecek temel kontroller.",
          "1. İnternet bağlantınızı kontrol edin.\n2. VPN istemcisini kapatıp yeniden açın.\n3. Kurum hesabınızla oturum açın ve çok faktörlü doğrulamayı tamamlayın.\n4. Hata sürüyorsa hata kodunu talebe ekleyin. Parolanızı paylaşmayın.",
          true,
        ],
        [
          "Yeni çalışan erişim kontrol listesi",
          "Erişim",
          "Yeni başlayan çalışanlar için hesap ve erişim adımları.",
          "Yönetici onayını alın. Gerekli uygulama ve erişim kapsamını belirtin. En az ayrıcalık ilkesine göre yetki isteyin. Başlangıç tarihini talep açıklamasına ekleyin.",
          true,
        ],
        [
          "Bilgisayar performansı için ilk kontroller",
          "Donanım",
          "Yavaş çalışan cihazlarda kontrol edilebilecek adımlar.",
          "Cihazı yeniden başlatın. Disk boş alanını kontrol edin. İşletim sistemi güncellemelerini tamamlayın. Sorun yaşanan uygulamayı ve başlangıç zamanını kaydedin.",
          true,
        ],
        [
          "Değişiklik öncesi kontrol listesi",
          "Operasyon",
          "Uygulama, doğrulama ve geri dönüş planının hazırlanması.",
          "Etki alanını ve bakım aralığını tanımlayın. Uygulama adımlarını, sorumlu kişiyi ve doğrulama ölçütünü yazın. Geri dönüş adımlarını ayrı ve uygulanabilir tutun.",
          true,
        ],
        [
          "İç operasyon notları",
          "Operasyon",
          "Destek ekibi için yayınlanmamış çalışma notları.",
          "Bu taslak yalnız destek ekibine görünür. Yayın öncesi kişisel ve gizli bilgileri kontrol edin.",
          false,
        ],
      ];
      for (const [title, category, summary, body, published] of articles)
        await save(Article, {
          title,
          category,
          summary,
          body,
          published,
          authorId: maya.id,
          version: 1,
        });
      const titles = [
        "VPN bağlantısı sürekli kopuyor",
        "Finans uygulamasında rapor alınamıyor",
        "Yeni çalışan için hesap açılması",
        "Toplantı odası ekranına görüntü gelmiyor",
        "Paylaşımlı klasör erişim talebi",
        "Kablosuz ağda kimlik doğrulama hatası",
        "Dizüstü bilgisayar pil değişimi",
        "CRM uygulamasında oturum sorunu",
        "Yazıcı ekleme talebi",
        "E-posta yönlendirme ayarı",
        "Sunucu disk kapasitesi uyarısı",
        "Lisans atama talebi",
        "Çift ekran kurulum desteği",
        "Uygulama erişim yetkisi güncellemesi",
        "VPN istemcisi güncellemesi",
        "Yeni cihaz hazırlığı",
        "Dosya paylaşımı yavaşlığı",
        "Raporlama uygulaması zaman aşımı",
        "Eski hesabın kapatılması",
        "Yedek cihaz teslimi",
      ];
      const states = [
        "NEW",
        "IN_PROGRESS",
        "PENDING",
        "IN_PROGRESS",
        "NEW",
        "IN_PROGRESS",
        "PENDING",
        "RESOLVED",
        "NEW",
        "CLOSED",
        "IN_PROGRESS",
        "NEW",
        "RESOLVED",
        "NEW",
        "IN_PROGRESS",
        "PENDING",
        "NEW",
        "RESOLVED",
        "CLOSED",
        "NEW",
      ] as const;
      for (let i = 0; i < titles.length; i++) {
        const ci = i % 4,
          cat = catalogs[ci];
        const agent = ci === 2 ? can : ci === 3 ? ece : maya;
        const impact = (["HIGH", "MEDIUM", "LOW"] as const)[i % 3],
          urgency = (["HIGH", "MEDIUM", "LOW"] as const)[(i + 1) % 3];
        const priority = priorityFor(impact, urgency);
        const policy = await m
          .getRepository(SlaPolicy)
          .findOneByOrFail({ priority });
        const age = i === 0 ? 0.2 : i === 1 ? 12 : i === 10 ? 60 : (i + 1) * 2;
        const createdAt = new Date(Date.now() - age * 3600000),
          status = states[i];
        const t = await save(Ticket, {
          title: titles[i],
          description: `${titles[i]}.\n\nÇalışma sırasında bu durumla karşılaşıldı. Sorunun kapsamı ve ilk kontrol sonuçları destek ekibince değerlendirilecek.\n\nBu kayıt, ürünün iş akışlarını göstermek için oluşturulmuş kurgusal örnektir.`,
          type: i % 3 === 0 ? "INCIDENT" : "REQUEST",
          category: cat.category,
          catalogId: cat.id,
          impact,
          urgency,
          priority,
          status,
          requesterId: i % 2 ? ayse.id : deniz.id,
          teamId: cat.teamId,
          assigneeId: status === "NEW" ? null : agent.id,
          assetId: i % 4 === 0 ? assets[0].id : null,
          createdAt,
          responseDueAt: new Date(+createdAt + policy.responseMinutes * 60000),
          resolutionDueAt: new Date(
            +createdAt + policy.resolutionMinutes * 60000,
          ),
          firstResponseAt:
            status === "NEW"
              ? null
              : new Date(
                  +createdAt + Math.min(20, policy.responseMinutes / 2) * 60000,
                ),
          resolvedAt: ["RESOLVED", "CLOSED"].includes(status)
            ? new Date(+createdAt + 3600000)
            : null,
          pausedAt:
            status === "PENDING" ? new Date(Date.now() - 1800000) : null,
          pausedMs: 0,
          resolution: ["RESOLVED", "CLOSED"].includes(status)
            ? "Kontroller tamamlandı, kullanıcıyla doğrulandı."
            : "",
          version: 1,
        });
        await audit(m, admin.id, "ticket", t.id, "CREATED", {
          type: t.type,
          priority: t.priority,
        });
        if (i < 5) {
          await save(Comment, {
            ticketId: t.id,
            authorId: agent.id,
            body: "İlk kontrolleri yapıyoruz. Gelişme olduğunda bu kayıt üzerinden paylaşacağız.",
            internal: false,
          });
          await save(Comment, {
            ticketId: t.id,
            authorId: agent.id,
            body: "İç not: ilgili ekip ile teknik inceleme planlandı.",
            internal: true,
          });
        }
      }
      for (let i = 0; i < 4; i++) {
        const status = ["PENDING_APPROVAL", "APPROVED", "SCHEDULED", "DRAFT"][
          i
        ];
        const c = await save(Change, {
          title: [
            "VPN ağ geçidi sürüm güncellemesi",
            "Uygulama sunucusu bakım çalışması",
            "Kablosuz ağ yapılandırması",
            "Lisans sunucusu geçişi",
          ][i],
          description:
            "Planlı bakım kapsamında hizmet sürekliliğini koruyarak güncelleme yapılması.",
          risk: i === 0 ? "HIGH" : "MEDIUM",
          reason: "Güncellik ve kararlılık iyileştirmeleri.",
          implementation:
            "1. Yedek alın.\n2. Bakım bildirimini paylaşın.\n3. Güncellemeyi uygulayın.\n4. Sağlık ve erişim testlerini tamamlayın.",
          rollback:
            "Önceki yapılandırma ve sürüme dönün. Erişim ve sağlık kontrollerini tekrarlayın.",
          plannedStart: new Date(Date.now() + (i + 1) * 86400000),
          plannedEnd: new Date(Date.now() + (i + 1) * 86400000 + 7200000),
          assetId: assets[2].id,
          status,
          requesterId: maya.id,
          approverId: ["APPROVED", "SCHEDULED"].includes(status)
            ? approver.id
            : null,
          approvedAt: ["APPROVED", "SCHEDULED"].includes(status)
            ? new Date()
            : null,
          decisionNote: "",
          version: 1,
        });
        await audit(m, maya.id, "change", c.id, "CREATED", { risk: c.risk });
      }
      console.log(
        "Seeded fictional teams, users, catalog, assets, tickets, knowledge and changes. Credentials remain in root .env.",
      );
    });
  } finally {
    await dataSource.destroy();
  }
}
seed().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
