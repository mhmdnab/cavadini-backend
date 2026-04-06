import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function seedAdmin(): Promise<void> {
  const email = 'ism-import@web.de';
  const password = 'cavadiniadmin123';

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true },
    create: { name: 'Admin', email, passwordHash, isAdmin: true },
  });
  console.log(`Admin ensured: ${email}`);
  await prisma.$disconnect();
}

seedAdmin().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
