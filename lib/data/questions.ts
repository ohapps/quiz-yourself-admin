import { prisma } from "@/lib/prisma";

export async function getQuestionsByCategory(categoryId: string) {
  const existing = await prisma.question.findMany({
    where: { categoryId },
    select: { question: true }
  });
  return existing.map(e => e.question);
}

export async function updateQuestionRecord(
  id: string,
  data: {
    question: string;
    options: string[];
    correctAnswer: string;
    difficulty: string;
    imageUrl?: string | null;
  }
) {
  return await prisma.question.update({
    where: { id },
    data: {
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty,
      imageUrl: data.imageUrl,
    }
  });
}

export async function createQuestionRecord(data: {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  categoryId: string;
  imageUrl?: string | null;
}) {
  return await prisma.question.create({
    data: {
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
    }
  });
}

export async function createMultipleQuestionRecords(data: {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  categoryId: string;
  imageUrl?: string | null;
}[]) {
  return await prisma.question.createMany({
    data: data.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      categoryId: q.categoryId,
      imageUrl: q.imageUrl,
    }))
  });
}

export async function deleteQuestionRecord(id: string) {
  return await prisma.question.delete({
    where: { id }
  });
}
