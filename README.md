# rent-borrow-api

Backend API ของระบบยืม-เช่า — **NestJS 12 · TypeScript · PostgreSQL 16 (TypeORM) · Redis · RabbitMQ**
อิงจาก stack ใน `D:\new\README.md` ชุดเริ่มต้น (§8.7): modular monolith · Swagger → generate client ให้ FE

> สถานะ: auth + โดเมนครุภัณฑ์ (equipment / transactions / dashboard / activities) ครบใช้งานได้

## โครงสร้าง

```
src/
├── main.ts                       → bootstrap HTTP + RabbitMQ consumer · helmet · cors · ValidationPipe · Swagger /docs
├── app.module.ts                 → import ทุกโมดูล
├── modules/
│   ├── auth/                     → login/refresh/logout/me · JwtStrategy · JwtAuthGuard · @Public · @CurrentUser
│   ├── users/                    → User entity · UsersService (bcrypt) · UsersSeeder (บัญชีตัวอย่าง dev)
│   ├── equipment/                → ครุภัณฑ์: CRUD · ค้นหา/แบ่งหน้า · categories · adjustBorrowed
│   ├── transactions/             → รายการยืม-คืน: สร้าง/กรอง/เปลี่ยนสถานะ · ตัดจำนวนคงเหลือ
│   ├── dashboard/                → aggregate ตัวเลขสรุป + ข้อมูลกราฟทั้งหมด (SQL ล้วน)
│   ├── activities/               → ประวัติการทำรายการ + การแจ้งเตือน
│   └── seed/                     → DemoSeeder: ครุภัณฑ์ 20 · สมาชิก 8 · รายการ 520 (dev/E2E)
├── shared/
│   ├── config/                   → configuration.ts (typed config) + env.validation.ts (joi — fail fast)
│   ├── database/                 → TypeORM module · data-source.ts (CLI) · migrations/
│   ├── redis/                    → CacheModule (@keyv/redis) + REDIS_CLIENT (ioredis)
│   ├── messaging/                → ClientProxy RMQ (TASK_QUEUE) — abstraction ตาม §8.1
│   └── logger/                   → nestjs-pino + correlation id (x-correlation-id)
└── health/                       → @nestjs/terminus: GET /health (live) · GET /ready (db + redis)
```

## เริ่มต้น

### Lite mode — รันได้ทันที ไม่ต้องมี Docker (ค่า default ของ `.env.example`)

```bash
npm install
cp .env.example .env
npm run dev                # http://localhost:3001/api/v1 · Swagger http://localhost:3001/docs
```

ใช้ **SQLite** (ไฟล์ `.data/dev.sqlite`, sync schema อัตโนมัติ) · **cache ใน memory** · **ปิด RabbitMQ**
เหมาะกับ dev / เขียน E2E ช่วงแรก · log ตอน start จะบอกโหมด เช่น `[db=sqlite cache=memory mq=off]`

### Full mode — ของจริง (ต้องมี Docker)

```bash
docker compose -f docker-compose.local.yml up -d
#    PostgreSQL :5432 · Redis :6379 · RabbitMQ :5672 (UI :15672 user/pass rentborrow)
```

แล้วแก้ `.env` 3 บรรทัด:

```env
DB_DRIVER=postgres
CACHE_DRIVER=redis
MESSAGING_ENABLED=true
```

| env | lite | full |
|---|---|---|
| `DB_DRIVER` | `sqlite` → `.data/dev.sqlite` | `postgres` → `DATABASE_URL` + migration |
| `CACHE_DRIVER` | `memory` (ใน process) | `redis` |
| `MESSAGING_ENABLED` | `false` (ไม่เชื่อม MQ) | `true` |

> lite mode ไม่ใช้ migration — SQLite `synchronize` ให้อัตโนมัติ · พอย้ายไป postgres ค่อย `npm run migration:generate`

## Scripts

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` (= `start:dev`) | dev server (watch) |
| `npm run build` / `npm run start:prod` | build → `dist/` แล้วรัน |
| `npm run test` / `npm run test:e2e` | unit / e2e (e2e ต้องมี infra รันอยู่) |
| `npm run lint` / `npm run format` | eslint / prettier |
| `npm run migration:generate` | สร้าง migration จาก diff ของ entity |
| `npm run migration:run` / `migration:revert` | apply / rollback migration |

## กติกาที่ตั้งไว้แล้ว

- `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` เป็น global
- `synchronize` ปิดใน prod เสมอ — ใช้ migration เท่านั้น (`DB_SYNCHRONIZE=true` ได้เฉพาะ dev)
- ทุก request มี `x-correlation-id` (รับจาก FE หรือสร้างใหม่) และส่งกลับใน response
- Rate limit global ผ่าน `@nestjs/throttler` (`THROTTLE_TTL` / `THROTTLE_LIMIT`)
- Swagger เปิดเฉพาะ non-production · OpenAPI JSON ที่ `/docs/openapi.json` (ใช้ `openapi-typescript` / `orval` gen client ฝั่ง FE)
- Path alias `@/` → `src/` (Nest CLI rewrite เป็น relative ตอน build)
- **TypeScript 6** (NestJS 12 บังคับ) — `baseUrl` ใช้ไม่ได้แล้ว · `types` ต้องระบุเอง (`node`, `jest`) · `rootDir` อยู่ใน `tsconfig.build.json`
- `@nestjs/config` 12 validate ผ่าน Standard Schema — Joi 18 รองรับ · `abortEarly`/`allowUnknown` ตั้งบน schema (`.prefs()`) ไม่ใช่ `validationOptions`

## Auth (ทำแล้ว)

| Endpoint | ใช้ทำอะไร |
|---|---|
| `POST /api/v1/auth/login` | อีเมล+รหัสผ่าน → `{ accessToken, user }` · ตั้ง `refresh_token` เป็น httpOnly cookie |
| `POST /api/v1/auth/refresh` | ขอ access token ใหม่จาก cookie |
| `POST /api/v1/auth/logout` | ลบ refresh cookie |
| `GET /api/v1/auth/me` | ข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ต้องมี Bearer token) |

- รหัสผ่าน hash ด้วย bcrypt · access/refresh เป็น JWT แยก `type` กัน refresh token ถูกใช้แทน access
- login ผิด → ข้อความเดียวกันทั้งกรณีไม่มีอีเมลและรหัสผิด (กัน user enumeration)
- จำกัด login ด้วย `AUTH_THROTTLE_LIMIT` ครั้ง/นาที (dev ตั้ง 100 เพราะรัน E2E ซ้ำ · **prod ควรลดเหลือ 5-10**)

### บัญชีตัวอย่าง (dev/test เท่านั้น)

[`UsersSeeder`](src/modules/users/users.seeder.ts) สร้างให้อัตโนมัติตอน start เมื่อตาราง users ว่าง — ไม่ทำงานใน production

| อีเมล | รหัสผ่าน | สิทธิ์ |
|---|---|---|
| `admin@example.com` | `Passw0rd!` | admin |
| `user@example.com` | `Passw0rd!` | user |

## โดเมนครุภัณฑ์ (ทำแล้ว)

| Endpoint | ใช้ทำอะไร |
|---|---|
| `GET /equipment` | รายการครุภัณฑ์ — `search` `category` `status` `page` `limit` |
| `GET /equipment/categories` | ประเภททั้งหมด (เติม dropdown) |
| `POST/PATCH/DELETE /equipment[/:id]` | เพิ่ม/แก้/ลบ · รหัสซ้ำตอบ 409 |
| `GET /transactions` | รายการยืม-คืน — `type` `status` `search` `from` `to` |
| `POST /transactions` | สร้างรายการ · ยืมเกินคงเหลือตอบ 400 · ตัด `borrowedQuantity` ให้อัตโนมัติ |
| `PATCH /transactions/:id/status` | อนุมัติ/ปฏิเสธ/เสร็จสิ้น · ปฏิเสธแล้วคืนจำนวนที่กันไว้ |
| `GET /dashboard/summary?range=` | การ์ดสรุป 4 ใบ + กราฟเส้น + ยอดนิยม + กราฟแท่งรายปี + รายการล่าสุด |
| `GET /activities` · `GET /notifications` · `POST /notifications/read-all` | ประวัติ/แจ้งเตือน |
| `GET /users` | รายชื่อสมาชิก |

ตัวเลขบนแดชบอร์ดคำนวณจากฐานข้อมูลจริงทั้งหมด (ไม่มี mock):
ครุภัณฑ์ทั้งหมด = `SUM(quantity)` · ยืมอยู่ = `SUM(borrowedQuantity)` · คงเหลือ = ผลต่าง ·
กราฟรายเดือนนับจาก `transactions.occurredAt`

### ข้อมูลตัวอย่าง (DemoSeeder)

สร้างอัตโนมัติตอน start เมื่อตาราง equipment ว่าง · **ไม่ทำงานใน production**
ครุภัณฑ์ 20 รายการ (รวม 6,632 หน่วย) · สมาชิก 8 คน · รายการยืม-คืน 520 รายการย้อนหลัง 23 เดือน
ใช้ random แบบ deterministic (mulberry32) — ข้อมูลเหมือนเดิมทุกครั้ง E2E จึงเชื่อถือได้

> รีเซ็ตข้อมูล: ปิด API แล้วลบ `.data/dev.sqlite` · start ใหม่จะ seed ให้อีกครั้ง

## ขั้นต่อไป (ยังไม่เริ่ม)

1. อัปโหลดรูปครุภัณฑ์จริง (ตอนนี้ wizard เก็บแค่ชื่อไฟล์ ยังไม่มี endpoint รับไฟล์)
2. `modules/roles` — permission ละเอียดกว่า role เดี่ยว (ตอนนี้ทุก endpoint แค่ต้องล็อกอิน)
3. `modules/ml-bridge` — ส่งงานเข้า RabbitMQ ให้ BE ML
4. refresh token rotation + blacklist ใน Redis (ตอนนี้ refresh เป็น stateless JWT)
