import 'dotenv/config';
import { PrismaClient, Status, Priority } from '@prisma/client';

const prisma = new PrismaClient();

const tasks = [
  {
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: Status.OPEN,
    priority: Priority.HIGH,
    dueDate: new Date('2026-09-30'),
  },
  {
    title: 'Write API documentation',
    description: 'Document all REST endpoints using OpenAPI spec',
    status: Status.OPEN,
    priority: Priority.MEDIUM,
    dueDate: new Date('2026-09-15'),
  },
  {
    title: 'Fix login session bug',
    description: 'Users report intermittent 401 errors on token refresh',
    status: Status.DONE,
    priority: Priority.HIGH,
    dueDate: null,
  },
  {
    title: 'Update npm dependencies',
    description: null,
    status: Status.OPEN,
    priority: Priority.LOW,
    dueDate: null,
  },
  {
    title: 'Design dashboard mockups',
    description: 'Create Figma wireframes for the main dashboard view',
    status: Status.DONE,
    priority: Priority.MEDIUM,
    dueDate: new Date('2026-08-01'),
  },
];

async function main() {
  console.log('Seeding database...');
  await prisma.task.deleteMany();
  await prisma.task.createMany({ data: tasks });
  console.log(`Seeded ${tasks.length} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
