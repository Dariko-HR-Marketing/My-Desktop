import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { APP_CATALOG, MODULE_CATALOG } from '../src/store/catalog.js';

const db = new PrismaClient();

for (const a of APP_CATALOG) {
  await db.appLink.upsert({ where: { key: a.key }, create: a, update: a });
}
for (const m of MODULE_CATALOG) {
  await db.module.upsert({ where: { key: m.key }, create: m, update: m });
}

const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (adminPassword && adminPassword.length >= 10) {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({
    where: { login: 'admin' },
    create: {
      login: 'admin',
      fullName: 'Administrator',
      role: 'ADMIN',
      position: 'IT administrator',
      department: 'IT',
      passwordHash,
    },
    update: {},
  });
} else {
  console.warn('SEED_ADMIN_PASSWORD (>= 10 chars) not set — admin user was not created');
}
await db.$disconnect();
