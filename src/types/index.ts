// ── Element codes ──────────────────────────────────────────────

export const ELEMENT_CODES = ['FB', 'HM', 'ML', 'RH', 'TO', 'TH', 'TE', 'AU'] as const;
export type ElementCode = (typeof ELEMENT_CODES)[number];

export const ELEMENT_NAMES: Record<ElementCode, string> = {
  FB: 'Fretboard',
  HM: 'Harmony',
  ML: 'Melody',
  RH: 'Rhythm',
  TO: 'Tone',
  TH: 'Theory',
  TE: 'Technique',
  AU: 'Aural',
};

// ── Question types ────────────────────────────────────────────

export type QuestionType = 'scenario' | 'checklist' | 'experience';

export interface ScenarioOption {
  key: string; // "a" through "e"
  text: string;
  points: number; // 1, 3, 5, 7, or 10
}

export interface ChecklistItem {
  index: number; // 0-based
  text: string;
  points: number; // variable (1–10)
}

interface QuestionBase {
  id: string; // e.g., "fb_01"
  elementCode: ElementCode;
  elementName: string;
  position: number; // 1–24
}

export interface ScenarioQuestion extends QuestionBase {
  type: 'scenario';
  headline: string;
  subheadline: string;
  text: string;
  options: ScenarioOption[];
}

export interface ChecklistQuestion extends QuestionBase {
  type: 'checklist';
  text: string;
  items: ChecklistItem[];
}

export interface ExperienceQuestion extends QuestionBase {
  type: 'experience';
  text: string;
  options: ScenarioOption[];
}

export type Question = ScenarioQuestion | ChecklistQuestion | ExperienceQuestion;

// ── Answers ───────────────────────────────────────────────────

export interface ScenarioAnswer {
  questionId: string;
  elementCode: ElementCode;
  questionType: 'scenario';
  selectedOption: string; // "a" through "e"
  points: number;
}

export interface ChecklistAnswer {
  questionId: string;
  elementCode: ElementCode;
  questionType: 'checklist';
  checkedItems: number[]; // indices of checked items
  points: number; // calculated mean of checked items, or 1 if empty
}

export interface ExperienceAnswer {
  questionId: string;
  elementCode: ElementCode;
  questionType: 'experience';
  selectedOption: string;
  points: number;
}

export type Answer = ScenarioAnswer | ChecklistAnswer | ExperienceAnswer;

// ── Scoring ───────────────────────────────────────────────────

export interface ElementScore {
  elementCode: ElementCode;
  elementName: string;
  score: number; // 1–10, rounded integer
  band: ScoreBand;
}

export interface ScoreBand {
  key: string;
  label: string;
  description: string;
}

export interface BalanceScore {
  value: number; // 1–10
  sd: number; // standard deviation
}

export interface Archetype {
  key: string;
  name: string;
  message: string;
}

export interface CtaBand {
  label: string;
  description: string;
  minScore: number;
  maxScore: number;
}

export interface AssessmentResult {
  elementScores: ElementScore[];
  overallScore: number; // 8–80
  overallPercentage: number;
  balance: BalanceScore;
  archetype: Archetype;
  cta: CtaBand;
  weakestElements: ElementCode[];
  strongestElements: ElementCode[];
}
