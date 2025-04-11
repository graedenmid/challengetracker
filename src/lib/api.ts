import { Challenge, ChallengeEntry } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getChallenges(): Promise<Challenge[]> {
  const response = await fetch(`${API_URL}/api/challenges`);
  if (!response.ok) {
    throw new Error("Failed to fetch challenges");
  }
  return response.json();
}

export async function getChallenge(id: string): Promise<Challenge> {
  const response = await fetch(`${API_URL}/api/challenges/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch challenge");
  }
  return response.json();
}

export async function createChallenge(
  challenge: Omit<Challenge, "id" | "createdAt" | "updatedAt">
): Promise<Challenge> {
  const response = await fetch(`${API_URL}/api/challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(challenge),
  });
  if (!response.ok) {
    throw new Error("Failed to create challenge");
  }
  return response.json();
}

export async function deleteChallenge(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/challenges/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete challenge");
  }
}

export async function getChallengeEntries(
  challengeId: string
): Promise<ChallengeEntry[]> {
  const response = await fetch(
    `${API_URL}/api/challenges/${challengeId}/entries`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch entries");
  }
  return response.json();
}

export async function createChallengeEntry(
  challengeId: string,
  entry: Omit<ChallengeEntry, "id" | "challengeId" | "createdAt" | "updatedAt">
): Promise<ChallengeEntry> {
  const response = await fetch(
    `${API_URL}/api/challenges/${challengeId}/entries`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to create entry");
  }
  return response.json();
}

export async function updateChallenge(
  id: string,
  challenge: Partial<
    Omit<Challenge, "id" | "createdAt" | "updatedAt" | "userId">
  >
): Promise<Challenge> {
  const response = await fetch(`${API_URL}/api/challenges/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(challenge),
  });
  if (!response.ok) {
    throw new Error("Failed to update challenge");
  }
  return response.json();
}
