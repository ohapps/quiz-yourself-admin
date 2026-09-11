import { DifficultyLevel } from "@/lib/data/types";

export interface ParsedQuestionItem {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: DifficultyLevel;
  type: "multiple_choice" | "numeric";
  imageUrl?: string | null;
}

export interface CsvRowError {
  rowNumber: number;
  questionSnippet?: string;
  message: string;
}

export interface CsvParseResult {
  validQuestions: ParsedQuestionItem[];
  errors: CsvRowError[];
  totalRows: number;
}

/**
 * Parses raw CSV text into a 2D array of strings, handling quotes, escaped quotes (""),
 * newlines inside quoted cells, and UTF-8 BOM markers.
 */
export function parseRawCsv(text: string): string[][] {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // Skip the next quote
        } else {
          // End of quoted cell
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++; // Handle CRLF
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  // Final cell & row if non-empty
  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeDifficulty(val: string | undefined): DifficultyLevel {
  if (!val) return DifficultyLevel.Medium;
  const lower = val.trim().toLowerCase();
  if (lower === "easy") return DifficultyLevel.Easy;
  if (lower === "hard") return DifficultyLevel.Hard;
  return DifficultyLevel.Medium;
}

const VALID_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

function validateImageUrl(url?: string | null): { valid: boolean; url: string | null; error?: string } {
  if (!url || url.trim() === "") {
    return { valid: true, url: null };
  }
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, url: null, error: "Image URL must start with http:// or https://" };
    }
    const pathname = parsed.pathname.toLowerCase();
    const hasValidExt = VALID_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    if (!hasValidExt) {
      return { valid: false, url: null, error: "Image URL must end with .png, .jpg, .jpeg, .gif, .webp, or .svg" };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, url: null, error: "Invalid Image URL format" };
  }
}

/**
 * Parses and validates CSV string content into Quiz Questions.
 */
export function parseQuestionsCsv(csvContent: string): CsvParseResult {
  const rawRows = parseRawCsv(csvContent);
  if (rawRows.length === 0) {
    return {
      validQuestions: [],
      errors: [{ rowNumber: 1, message: "The CSV file is empty." }],
      totalRows: 0,
    };
  }

  const headerRow = rawRows[0];
  const normalizedHeaders = headerRow.map(normalizeHeader);

  // Map header indexes
  const colIndex = {
    question: normalizedHeaders.findIndex((h) => ["question", "questiontext", "prompt", "q"].includes(h)),
    option1: normalizedHeaders.findIndex((h) => ["option1", "optiona", "opta", "opt1", "a"].includes(h)),
    option2: normalizedHeaders.findIndex((h) => ["option2", "optionb", "optb", "opt2", "b"].includes(h)),
    option3: normalizedHeaders.findIndex((h) => ["option3", "optionc", "optc", "opt3", "c"].includes(h)),
    option4: normalizedHeaders.findIndex((h) => ["option4", "optiond", "optd", "opt4", "d"].includes(h)),
    options: normalizedHeaders.findIndex((h) => ["options", "choices", "answers"].includes(h)),
    correctAnswer: normalizedHeaders.findIndex((h) =>
      ["correctanswer", "correct", "answer", "ans", "correctoption"].includes(h)
    ),
    difficulty: normalizedHeaders.findIndex((h) => ["difficulty", "level", "diff"].includes(h)),
    type: normalizedHeaders.findIndex((h) => ["type", "questiontype", "qtype"].includes(h)),
    imageUrl: normalizedHeaders.findIndex((h) => ["imageurl", "image", "img", "picture"].includes(h)),
  };

  if (colIndex.question === -1) {
    return {
      validQuestions: [],
      errors: [
        {
          rowNumber: 1,
          message: "CSV header missing required 'question' column. Found headers: " + headerRow.join(", "),
        },
      ],
      totalRows: 0,
    };
  }

  const validQuestions: ParsedQuestionItem[] = [];
  const errors: CsvRowError[] = [];
  const dataRows = rawRows.slice(1);

  dataRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 for 1-based index, +1 for header row
    const questionText = (colIndex.question !== -1 ? row[colIndex.question] : "")?.trim() || "";

    if (!questionText) {
      errors.push({
        rowNumber,
        message: "Question text is required.",
      });
      return;
    }

    const questionSnippet = questionText.length > 40 ? questionText.slice(0, 37) + "..." : questionText;

    // Determine type
    const rawType = (colIndex.type !== -1 ? row[colIndex.type] : "")?.trim().toLowerCase() || "";
    let questionType: "multiple_choice" | "numeric" = "multiple_choice";
    if (rawType === "numeric" || rawType === "number") {
      questionType = "numeric";
    }

    // Determine difficulty
    const rawDifficulty = colIndex.difficulty !== -1 ? row[colIndex.difficulty] : undefined;
    const difficulty = normalizeDifficulty(rawDifficulty);

    // Image URL validation
    const rawImageUrl = colIndex.imageUrl !== -1 ? row[colIndex.imageUrl] : undefined;
    const imageValidation = validateImageUrl(rawImageUrl);
    if (!imageValidation.valid) {
      errors.push({
        rowNumber,
        questionSnippet,
        message: imageValidation.error || "Invalid image URL",
      });
      return;
    }

    const rawCorrectAnswer = (colIndex.correctAnswer !== -1 ? row[colIndex.correctAnswer] : "")?.trim() || "";

    if (!rawCorrectAnswer) {
      errors.push({
        rowNumber,
        questionSnippet,
        message: "Correct answer is missing.",
      });
      return;
    }

    if (questionType === "numeric") {
      if (isNaN(Number(rawCorrectAnswer))) {
        errors.push({
          rowNumber,
          questionSnippet,
          message: `Correct answer '${rawCorrectAnswer}' must be a valid number for numeric questions.`,
        });
        return;
      }

      validQuestions.push({
        question: questionText,
        options: [],
        correctAnswer: rawCorrectAnswer,
        difficulty,
        type: "numeric",
        imageUrl: imageValidation.url,
      });
    } else {
      // Multiple choice options extraction
      let extractedOptions: string[] = [];

      if (
        colIndex.option1 !== -1 &&
        colIndex.option2 !== -1 &&
        colIndex.option3 !== -1 &&
        colIndex.option4 !== -1
      ) {
        extractedOptions = [
          (row[colIndex.option1] || "").trim(),
          (row[colIndex.option2] || "").trim(),
          (row[colIndex.option3] || "").trim(),
          (row[colIndex.option4] || "").trim(),
        ];
      } else if (colIndex.options !== -1) {
        const rawOptionsStr = row[colIndex.options] || "";
        // Try delimiter: pipe '|', semicolon ';', or comma if separated
        if (rawOptionsStr.includes("|")) {
          extractedOptions = rawOptionsStr.split("|").map((o) => o.trim());
        } else if (rawOptionsStr.includes(";")) {
          extractedOptions = rawOptionsStr.split(";").map((o) => o.trim());
        } else {
          extractedOptions = rawOptionsStr.split(",").map((o) => o.trim());
        }
      }

      // Check if we have 4 non-empty options
      if (extractedOptions.length !== 4 || extractedOptions.some((o) => o === "")) {
        errors.push({
          rowNumber,
          questionSnippet,
          message: `Multiple choice question must have exactly 4 options. Found ${extractedOptions.filter(Boolean).length} non-empty options.`,
        });
        return;
      }

      // Resolve correct answer (could be exact text, or 'A'/'B'/'C'/'D' / '1'/'2'/'3'/'4')
      let resolvedCorrectAnswer = rawCorrectAnswer;
      const upperAns = rawCorrectAnswer.toUpperCase();

      if (upperAns === "A" || upperAns === "1") {
        resolvedCorrectAnswer = extractedOptions[0];
      } else if (upperAns === "B" || upperAns === "2") {
        resolvedCorrectAnswer = extractedOptions[1];
      } else if (upperAns === "C" || upperAns === "3") {
        resolvedCorrectAnswer = extractedOptions[2];
      } else if (upperAns === "D" || upperAns === "4") {
        resolvedCorrectAnswer = extractedOptions[3];
      }

      if (!extractedOptions.includes(resolvedCorrectAnswer)) {
        errors.push({
          rowNumber,
          questionSnippet,
          message: `Correct answer '${rawCorrectAnswer}' does not match any of the 4 options: [${extractedOptions.join(", ")}].`,
        });
        return;
      }

      validQuestions.push({
        question: questionText,
        options: extractedOptions,
        correctAnswer: resolvedCorrectAnswer,
        difficulty,
        type: "multiple_choice",
        imageUrl: imageValidation.url,
      });
    }
  });

  return {
    validQuestions,
    errors,
    totalRows: dataRows.length,
  };
}

/**
 * Generates sample CSV template content with headers and sample rows.
 */
export function getSampleCsvTemplate(): string {
  return [
    `question,option1,option2,option3,option4,correctAnswer,difficulty,type,imageUrl`,
    `"What is the capital of France?","Paris","London","Berlin","Madrid","Paris","Easy","multiple_choice",""`,
    `"Which planet is known as the Red Planet?","Venus","Mars","Jupiter","Saturn","Mars","Easy","multiple_choice",""`,
    `"How many sides does an octagon have?","","","","","8","Easy","numeric",""`,
    `"What is the rarest blood type in humans?","AB-Negative","O-Positive","B-Positive","A-Negative","AB-Negative","Hard","multiple_choice",""`,
    `"In what year did the Apollo 11 moon landing occur?","","","","","1969","Medium","numeric",""`
  ].join("\n");
}
