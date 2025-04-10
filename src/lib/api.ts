import { Challenge, ChallengeType, Frequency } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function createChallenge(data: {
  title: string;
  description: string;
  type: string;
  target: number;
  unit: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}): Promise<Challenge> {
  const response = await fetch("/api/challenges", {
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
  const response = await fetch("/api/challenges", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch challenges");
  }

  return response.json();
}

export async function getChallenge(id: string): Promise<Challenge> {
  const response = await fetch(`/api/challenges/${id}`);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch challenge");
  }
  return response.json();
}
