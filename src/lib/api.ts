import { Challenge, ChallengeType, Frequency } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function createChallenge(data: {
  title: string;
  description?: string;
  type: ChallengeType;
  target: number;
  unit: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
}): Promise<Challenge> {
  const response = await fetch(`${API_BASE_URL}/api/challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create challenge");
  }

  return response.json();
}

export async function getChallenges(): Promise<Challenge[]> {
  const response = await fetch(`${API_BASE_URL}/api/challenges`);

  if (!response.ok) {
    throw new Error("Failed to fetch challenges");
  }

  return response.json();
}
