# 06 · Maʼlumotlar modeli (PostgreSQL / Prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { EMPLOYEE MANAGER ADMIN }
enum TaskStatus { TODO IN_PROGRESS DONE CANCELLED }
enum TaskPriority { LOW NORMAL HIGH }
enum TaskSource { PLAN MANAGER PERSONAL MODULE }
enum NotificationCategory { WORK MESSAGE SYSTEM }
enum AppCategory { MESSENGER SOCIAL VIDEO WORK GOV SEARCH }

model User {
  id            String   @id @default(uuid())
  login         String   @unique
  fullName      String
  position      String   @default("")
  department    String   @default("")
  role          Role     @default(EMPLOYEE)
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tasks         Task[]
  notifications Notification[]
  settings      UserSettings?
}

model Task {
  id          String       @id @default(uuid())
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  title       String
  notes       String?
  source      TaskSource   @default(PERSONAL)
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(NORMAL)
  dueAt       DateTime?
  assignedBy  String?
  assignee    String?      // tez yozishdagi @ijrochi
  list        String?      // tez yozishdagi #roʻyxat
  externalRef String?      // masalan: "edo:doc:03-12/458"
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  completedAt DateTime?
  @@index([userId, status])
  @@index([userId, dueAt])
}

model Notification {
  id          String               @id @default(uuid())
  user        User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  category    NotificationCategory
  title       String
  body        String
  actionLabel String?
  actionUrl   String?              // "module://edo/documents" yoki https://...
  readAt      DateTime?
  createdAt   DateTime             @default(now())
  @@index([userId, readAt])
}

model UserSettings {
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String   @id
  theme        String   @default("system")
  density      String   @default("comfortable")
  language     String   @default("uz-Latn")
  pinnedApps   String[] @default(["telegram", "whatsapp", "instagram", "youtube"])
  navCollapsed Boolean  @default(false)
  fontSize     String   @default("md")
  quietEnabled Boolean  @default(false)
  quietFrom    String   @default("22:00")
  quietTo      String   @default("07:00")
  sleepMinutes Int      @default(10)
  updatedAt    DateTime @updatedAt
}

model AppLink {
  key       String      @id
  name      String
  url       String
  category  AppCategory
  color     String
  mandatory Boolean     @default(false)
  order     Int         @default(0)
}

model Module {
  key         String @id
  name        String
  description String
  roles       Role[]
  version     String @default("0.1.0")
}
```

## Boshlangʻich maʼlumotlar (seed)

**Ilovalar katalogi:**

| key | name | url | category | color |
|---|---|---|---|---|
| telegram | Telegram | https://web.telegram.org/a/ | MESSENGER | #2B6CB0 |
| whatsapp | WhatsApp | https://web.whatsapp.com/ | MESSENGER | #1F8A52 |
| instagram | Instagram | https://www.instagram.com/ | SOCIAL | #B83280 |
| facebook | Facebook | https://www.facebook.com/ | SOCIAL | #3B5BDB |
| youtube | YouTube | https://www.youtube.com/ | VIDEO | #C4282E |
| linkedin | LinkedIn | https://www.linkedin.com/ | SOCIAL | #0E6BA8 |
| google | Google | https://www.google.com/ | SEARCH | #475467 |
| lex | Lex.uz | https://lex.uz/ | GOV | #1D4ED8 |
| mygov | my.gov.uz | https://my.gov.uz/ | GOV | #1D4ED8 |
| soliq | soliq.uz | https://soliq.uz/ | GOV | #1D4ED8 |

**Modullar:**

| key | name | roles |
|---|---|---|
| edo | Hujjat aylanishi | EMPLOYEE, MANAGER, ADMIN |
| hr | Kadrlar xizmatlari | EMPLOYEE, MANAGER, ADMIN |
| manager | Rahbar paneli | MANAGER, ADMIN |

**Administrator:** login `admin`, parol — `SEED_ADMIN_PASSWORD` muhit oʻzgaruvchisidan (≥ 10 belgi). Xodimlar `scripts/create-user.ts` orqali (parol `USER_PASSWORD` dan — buyruqlar tarixida qolmasligi uchun).

**Demo rejim (`DATA_STORE=memory`):** foydalanuvchilar `xodim`, `rahbar`, `admin` (parol `demo12345`), maketlardagi vazifalar va bildirishnomalar — faqat ishlab chiqish va testlar uchun.

## Keyingi bosqichda qoʻshiladigan jadvallar

- `AuditLog` (kim, qachon, nima) — hujjat va modul amallari uchun (shaxsiy brauzer tarixi yozilmaydi).
- `Device` (agent oʻrnatilgan kompyuterlar, versiya, oxirgi faollik).
- `Announcement` + `AnnouncementAck` («Tanishdim»).
- `CalendarEvent` (yoki tashqi kalendar integratsiyasi).
