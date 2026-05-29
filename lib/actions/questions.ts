"use server";

import { incrementContentVersion } from "@/lib/data/app-state";
import { createQuestionRecord, deleteQuestionRecord, updateQuestionRecord } from "@/lib/data/questions";
import { DifficultyLevel } from "@/lib/data/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const QuestionType = z.enum(["multiple_choice", "numeric"]);

const BaseQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  difficulty: z.enum(Object.values(DifficultyLevel) as [string, ...string[]], {
    message: "Difficulty must be Easy, Medium, or Hard"
  }),
  categoryId: z.string().min(1, "Category ID is required"),
  type: QuestionType.default("multiple_choice"),
  imageUrl: z.string()
    .url("Image URL must be a valid URL starting with http:// or https://")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        const pathname = parsed.pathname.toLowerCase();
        return (
          pathname.endsWith(".png") ||
          pathname.endsWith(".jpg") ||
          pathname.endsWith(".jpeg") ||
          pathname.endsWith(".gif") ||
          pathname.endsWith(".webp") ||
          pathname.endsWith(".svg")
        );
      } catch {
        return false;
      }
    }, "Image URL must end with a supported format: .png, .jpg, .jpeg, .gif, .webp, or .svg")
    .nullish(),
});

const QuestionSchema = z.discriminatedUnion("type", [
  BaseQuestionSchema.extend({
    type: z.literal("multiple_choice"),
    options: z.array(z.string().min(1, "Option cannot be empty")).length(4, "Must have exactly 4 options"),
    correctAnswer: z.string().min(1, "Correct answer is required"),
  }).refine(data => data.options.includes(data.correctAnswer), {
    message: "Correct answer must be one of the provided options",
    path: ["correctAnswer"]
  }),
  BaseQuestionSchema.extend({
    type: z.literal("numeric"),
    options: z.array(z.string()).default([]),
    correctAnswer: z.string().min(1, "Correct answer is required"),
  }).refine(data => !isNaN(Number(data.correctAnswer)), {
    message: "Correct answer must be a valid number",
    path: ["correctAnswer"]
  }),
]);

export async function createQuestion(data: {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  categoryId: string;
  type?: string;
  imageUrl?: string | null;
}) {
  try {
    const validatedData = QuestionSchema.parse(data);

    await createQuestionRecord({
      question: validatedData.question,
      options: validatedData.options,
      correctAnswer: validatedData.correctAnswer,
      difficulty: validatedData.difficulty,
      type: validatedData.type,
      categoryId: validatedData.categoryId,
      imageUrl: validatedData.imageUrl,
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
    type?: string;
    imageUrl?: string | null;
  }
) {
  try {
    const validatedData = QuestionSchema.parse(data);

    await updateQuestionRecord(id, {
      question: validatedData.question,
      options: validatedData.options,
      correctAnswer: validatedData.correctAnswer,
      difficulty: validatedData.difficulty,
      type: validatedData.type,
      imageUrl: validatedData.imageUrl,
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
