"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DifficultyLevel } from "@/lib/data/types";
import { updateQuestionRecord, createQuestionRecord, deleteQuestionRecord } from "@/lib/data/questions";
import { incrementContentVersion } from "@/lib/data/app-state";

const QuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).length(4, "Must have exactly 4 options"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  difficulty: z.enum(Object.values(DifficultyLevel) as [string, ...string[]], {
    message: "Difficulty must be Easy, Medium, or Hard"
  }),
  categoryId: z.string().min(1, "Category ID is required"),
}).refine(data => data.options.includes(data.correctAnswer), {
  message: "Correct answer must be one of the provided options",
  path: ["correctAnswer"]
});

export async function createQuestion(data: {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  categoryId: string;
}) {
  try {
    const validatedData = QuestionSchema.parse(data);

    await createQuestionRecord({
      question: validatedData.question,
      options: validatedData.options,
      correctAnswer: validatedData.correctAnswer,
      difficulty: validatedData.difficulty,
      categoryId: validatedData.categoryId,
    });

    await incrementContentVersion();
    revalidatePath(`/category/${validatedData.categoryId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create question:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(", ") };
    }
    return { success: false, error: "Failed to create question" };
  }
}

export async function updateQuestion(
  id: string, 
  data: {
    question: string;
    options: string[];
    correctAnswer: string;
    difficulty: string;
    categoryId: string;
  }
) {
  try {
    const validatedData = QuestionSchema.parse(data);

    await updateQuestionRecord(id, {
      question: validatedData.question,
      options: validatedData.options,
      correctAnswer: validatedData.correctAnswer,
      difficulty: validatedData.difficulty,
    });

    await incrementContentVersion();
    revalidatePath(`/category/${validatedData.categoryId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update question:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(", ") };
    }
    return { success: false, error: "Failed to update question" };
  }
}

export async function deleteQuestion(id: string, categoryId: string) {
  try {
    await deleteQuestionRecord(id);
    await incrementContentVersion();
    revalidatePath(`/category/${categoryId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete question:", error);
    return { success: false, error: "Failed to delete question" };
  }
}
