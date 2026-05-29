"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { DifficultyLevel } from "@/lib/data/types";
import { getQuestionsByCategory, createMultipleQuestionRecords } from "@/lib/data/questions";
import { incrementContentVersion } from "@/lib/data/app-state";
import { revalidatePath } from "next/cache";

type QuestionType = "multiple_choice" | "numeric";

const GeneratedMultipleChoiceSchema = z.object({
  question: z.string().describe("The text of the multiple choice question."),
  options: z.array(z.string()).length(4).describe("Exactly 4 possible answers for the question."),
  correctAnswer: z.string().describe("The correct answer. Must exactly match one of the options."),
  difficulty: z.nativeEnum(DifficultyLevel).describe("The difficulty of the question: Easy, Medium, or Hard."),
  imageUrl: z.string().nullish().describe(
    "A valid, public, absolute image URL starting with http:// or https:// and ending with .png, .jpg, .jpeg, .gif, .webp, or .svg. Populate this ONLY if the prompt asks for questions with images, or if a visual reference is highly beneficial. Otherwise, set to null."
  ),
});

const GeneratedNumericSchema = z.object({
  question: z.string().describe("The text of the numeric question. The answer must be a single number."),
  correctAnswer: z.string().describe("The correct numeric answer as a string (e.g. '42', '3.14')."),
  difficulty: z.nativeEnum(DifficultyLevel).describe("The difficulty of the question: Easy, Medium, or Hard."),
  imageUrl: z.string().nullish().describe(
    "A valid, public, absolute image URL starting with http:// or https:// and ending with .png, .jpg, .jpeg, .gif, .webp, or .svg. Populate this ONLY if the prompt asks for questions with images, or if a visual reference is highly beneficial. Otherwise, set to null."
  ),
});

export async function generateMultipleQuestions(
  categoryId: string,
  categoryName: string, 
  count: number,
  prompt?: string,
  difficulty?: DifficultyLevel | 'Mixed',
  questionType: QuestionType = "multiple_choice"
) {
  try {
    const existingQuestions = await getQuestionsByCategory(categoryId);
    const existingQuestionsContext = existingQuestions.length > 0
      ? `\n\nDo NOT generate any questions that are similar to these existing ones in this category:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    if (questionType === "numeric") {
      const { object } = await generateObject({
        model: google('gemini-3-flash-preview'),
        schema: z.object({
          questions: z.array(GeneratedNumericSchema).describe(`Generate exactly ${count} unique numeric questions.`)
        }),
        prompt: `Generate ${count} unique numeric questions for the category "${categoryName}".
        Each question must have a single numeric answer (a number).
        The answer should be precise and unambiguous.
        ${difficulty && difficulty !== 'Mixed' ? `Set the difficulty to exactly ${difficulty} for all questions.` : `Set a realistic difficulty (Easy, Medium, Hard).`}
        ${prompt ? `Additional instructions: ${prompt}` : ''}
        If the user instructions or prompt ask for questions with images, provide a valid, public, absolute image URL in the imageUrl field. Otherwise, set imageUrl to null.
        Ensure all questions are unique, interesting, and do not repeat.${existingQuestionsContext}`,
      });

      if (object.questions.length === 0) {
        return { success: false, error: "Failed to generate valid questions." };
      }

      const recordsToInsert = object.questions.map(q => {
        let cleanImageUrl = q.imageUrl || null;
        if (cleanImageUrl) {
          try {
            const parsed = new URL(cleanImageUrl);
            const pathname = parsed.pathname.toLowerCase();
            const isValidExtension = 
              pathname.endsWith(".png") || pathname.endsWith(".jpg") || pathname.endsWith(".jpeg") ||
              pathname.endsWith(".gif") || pathname.endsWith(".webp") || pathname.endsWith(".svg");
            if (!isValidExtension) cleanImageUrl = null;
          } catch { cleanImageUrl = null; }
        }
        return {
          question: q.question,
          options: [],
          correctAnswer: q.correctAnswer,
          difficulty: difficulty && difficulty !== 'Mixed' ? difficulty : q.difficulty,
          type: "numeric" as const,
          categoryId,
          imageUrl: cleanImageUrl,
        };
      });

      await createMultipleQuestionRecords(recordsToInsert);
      await incrementContentVersion();
      revalidatePath(`/category/${categoryId}`);
      return { success: true, count: recordsToInsert.length, requestedCount: count };
    }

    // multiple_choice path
    const { object } = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: z.object({
        questions: z.array(GeneratedMultipleChoiceSchema).describe(`Generate exactly ${count} unique multiple choice questions.`)
      }),
      prompt: `Generate ${count} unique multiple choice questions for the category "${categoryName}".
      Each question must have exactly 4 options.
      One of the options must be the correct answer.
      ${difficulty && difficulty !== 'Mixed' ? `Set the difficulty to exactly ${difficulty} for all questions.` : `Set a realistic difficulty (Easy, Medium, Hard).`}
      ${prompt ? `Additional instructions: ${prompt}` : ''}
      If the user instructions or prompt ask for questions with images, or if the question requires visual context, provide a valid, public, absolute image URL in the imageUrl field. The URL must end with one of the supported formats (.png, .jpg, .jpeg, .gif, .webp, .svg). If no image is requested or needed, set imageUrl to null.
      Ensure all questions are unique, interesting, and do not repeat.${existingQuestionsContext}`,
    });

    let validQuestions = object.questions.filter(q => q.options.includes(q.correctAnswer));

    if (validQuestions.length === 0) {
      return { success: false, error: "Failed to generate valid questions." };
    }

    const recordsToInsert = validQuestions.map(q => {
      let cleanImageUrl = q.imageUrl || null;
      if (cleanImageUrl) {
        try {
          const parsed = new URL(cleanImageUrl);
          const pathname = parsed.pathname.toLowerCase();
          const isValidExtension = 
            pathname.endsWith(".png") || pathname.endsWith(".jpg") || pathname.endsWith(".jpeg") ||
            pathname.endsWith(".gif") || pathname.endsWith(".webp") || pathname.endsWith(".svg");
          if (!isValidExtension) cleanImageUrl = null;
        } catch { cleanImageUrl = null; }
      }
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: difficulty && difficulty !== 'Mixed' ? difficulty : q.difficulty,
        type: "multiple_choice" as const,
        categoryId,
        imageUrl: cleanImageUrl,
      };
    });

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
