import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { CATEGORIES, CONTENT_VERSION } from './data';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Create AppState
  await prisma.appState.upsert({
    where: { id: 'default' },
    update: { contentVersion: CONTENT_VERSION },
    create: { id: 'default', contentVersion: CONTENT_VERSION },
  });

  for (const category of CATEGORIES) {
    console.log(`Seeding category: ${category.name}`);
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
      },
    });

    if (category.questions && category.questions.length > 0) {
      await prisma.question.createMany({
        data: category.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          shownCount: q.shownCount || 0,
          categoryId: category.id,
        })),
      });
    }
  }
  
  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
