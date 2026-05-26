import { atom } from "jotai";
import { DifficultyLevel } from "@/lib/data/types";

export const aiGenCountAtom = atom<number | "">(5);
export const aiGenPromptAtom = atom<string>("");
export const aiGenDifficultyAtom = atom<DifficultyLevel | 'Mixed' | null>(null);
export const aiGenLastCategoryIdAtom = atom<string | null>(null);
