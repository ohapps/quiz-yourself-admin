import { prisma } from "@/lib/prisma";

export async function updateQuestionRecord(
  id: string,
  data: {
    question: string;
    options: string[];
    correctAnswer: string;
    difficulty: string;
  }
) {
  return await prisma.question.update({
    where: { id },
    data: {
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty,
    }
  });
}

export async function createQuestionRecord(data: {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  categoryId: string;
}) {
  return await prisma.question.create({
    data: {
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty,
      categoryId: data.categoryId,
    }
  });
}

export async function deleteQuestionRecord(id: string) {
  return await prisma.question.delete({
    where: { id }
  });
}
