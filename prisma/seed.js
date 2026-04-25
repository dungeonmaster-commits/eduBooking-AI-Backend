import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin1@edubooking.com' },
    update: {},
    create: {
      email:        'admin1@edubooking.com',
      passwordHash,
      role:         'ADMIN',
      isVerified:   true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName:  'User',
        },
      },
    },
  });

  console.log('✅ Admin user created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());