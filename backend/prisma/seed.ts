import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for admin
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      isApproved: true,
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Role: ADMIN`);

  // Create test patient user
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patient = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      passwordHash: patientPassword,
      fullName: 'Test Patient',
      role: 'PATIENT',
      isApproved: true,
      isActive: true,
    },
  });

  console.log(`✅ Created patient user: ${patient.email}`);
  console.log(`   Password: patient123`);
  console.log(`   Role: PATIENT`);

  // Create test editor user
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      passwordHash: editorPassword,
      fullName: 'Test Editor',
      role: 'EDITOR',
      isApproved: true,
      isActive: true,
    },
  });

  console.log(`✅ Created editor user: ${editor.email}`);
  console.log(`   Password: editor123`);
  console.log(`   Role: EDITOR`);

  console.log('\n📝 Test Accounts Created:');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ Admin Account                           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ Email: admin@example.com                │');
  console.log('│ Password: admin123                      │');
  console.log('└─────────────────────────────────────────┘');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ Patient Account                         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ Email: patient@example.com              │');
  console.log('│ Password: patient123                    │');
  console.log('└─────────────────────────────────────────┘');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ Editor Account                          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ Email: editor@example.com               │');
  console.log('│ Password: editor123                     │');
  console.log('└─────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
