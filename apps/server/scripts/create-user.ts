/**
 * Usage: USER_PASSWORD=... DATABASE_URL=... npx tsx scripts/create-user.ts <login> "<Full name>" [ROLE]
 * The password comes from the environment so it doesn't end up in shell history.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient, type Role } from '@prisma/client';

const [login, fullName, role = 'EMPLOYEE'] = process.argv.slice(2);
const password = process.env.USER_PASSWORD;
if (!login || !fullName || !password || password.length < 10) {
  console.error(
    'Usage: USER_PASSWORD=<min 10 chars> tsx scripts/create-user.ts <login> "<Full name>" [EMPLOYEE|MANAGER|ADMIN]',
  );
  process.exit(1);
}
if (!['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
  console.error(`Unknown role: ${role}`);
  process.exit(1);
}

const db = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);
const user = await db.user.upsert({
  where: { login },
  create: { login, fullName, role: role as Role, passwordHash },
  update: { fullName, role: role as Role, passwordHash },
});
console.log(`User ${user.login} (${user.role}) saved`);
await db.$disconnect();
