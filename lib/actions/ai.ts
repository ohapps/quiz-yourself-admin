"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { DifficultyLevel } from "@/lib/data/types";
import { getQuestionsByCategory, createMultipleQuestionRecords } from "@/lib/data/questions";
import { incrementContentVersion } from "@/lib/data/app-state";
import { revalidatePath } from "next/cache";

const GeneratedQuestionSchema = z.object({
  question: z.string().describe("The text of the multiple choice question."),
  options: z.array(z.string()).length(4).describe("Exactly 4 possible answers for the question."),
  correctAnswer: z.string().describe("The correct answer. Must exactly match one of the options."),
  difficulty: z.nativeEnum(DifficultyLevel).describe("The difficulty of the question: Easy, Medium, or Hard."),
});

export async function generateMultipleQuestions(
  categoryId: string,
  categoryName: string, 
  count: number,
  prompt?: string,
  difficulty?: DifficultyLevel | 'Mixed'
) {
  try {
    const existingQuestions = await getQuestionsByCategory(categoryId);
    const existingQuestionsContext = existingQuestions.length > 0
      ? `\n\nDo NOT generate any questions that are similar to these existing ones in this category:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const { object } = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: z.object({
        questions: z.array(GeneratedQuestionSchema).describe(`Generate exactly ${count} unique multiple choice questions.`)
      }),
      prompt: `Generate ${count} unique multiple choice questions for the category "${categoryName}".
      Each question must have exactly 4 options.
      One of the options must be the correct answer.
      ${difficulty && difficulty !== 'Mixed' ? `Set the difficulty to exactly ${difficulty} for all questions.` : `Set a realistic difficulty (Easy, Medium, Hard).`}
      ${prompt ? `Additional instructions: ${prompt}` : ''}
      Ensure all questions are unique, interesting, and do not repeat.${existingQuestionsContext}`,
    });

    let validQuestions = object.questions.filter(q => q.options.includes(q.correctAnswer));

    if (validQuestions.length === 0) {
      return { success: false, error: "Failed to generate valid questions." };
    }

    const recordsToInsert = validQuestions.map(q => ({
      ...q,
      difficulty: difficulty && difficulty !== 'Mixed' ? difficulty : q.difficulty,
      categoryId
    }));

    await createMultipleQuestionRecords(recordsToInsert);
    await incrementContentVersion();
    revalidatePath(`/category/${categoryId}`);

    return { 
      success: true, 
      count: validQuestions.length,
      requestedCount: count 
    };
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    return { success: false, error: error.message || "Failed to generate questions using AI. Ensure GOOGLE_GENERATIVE_AI_API_KEY is set." };
  }
}
