export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target: number;
  unit: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isIncremental?: boolean;
  baseValue?: number;
  incrementValue: number;
  metadata?: Record<string, any>;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  date: string;
  value: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeType = "HABIT" | "GOAL" | "CHALLENGE";
export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "NONE";
