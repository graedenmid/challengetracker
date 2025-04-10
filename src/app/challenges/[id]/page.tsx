"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Challenge, ChallengeEntry } from "@/types";
import { EntryForm } from "@/components/EntryForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getChallenge } from "@/lib/api";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/entries`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login");
          return;
        }
        throw new Error("Failed to fetch entries");
      }
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError("Failed to load entries");
    }
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const data = await getChallenge(params.id as string);
        setChallenge(data);
        await fetchEntries();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch challenge"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [params.id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCurrentTarget = (challenge: Challenge) => {
    if (!challenge.isIncremental) {
      return challenge.target;
    }

    const startDate = new Date(challenge.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return challenge.baseValue + diffDays * challenge.incrementPerDay;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Challenge not found
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {challenge.title}
              </h1>
              {challenge.description && (
                <p className="text-gray-600">{challenge.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Type</h2>
                <p>{challenge.type}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Frequency</h2>
                <p>{challenge.frequency}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Target</h2>
                <p>
                  {challenge.isIncremental ? (
                    <>
                      Today's target: {getCurrentTarget(challenge)}{" "}
                      {challenge.unit}
                      <br />
                      <span className="text-sm text-gray-500">
                        (Base: {challenge.baseValue}, +
                        {challenge.incrementPerDay} per day)
                      </span>
                    </>
                  ) : (
                    <>
                      {challenge.target} {challenge.unit}
                    </>
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Duration</h2>
                <p>
                  {new Date(challenge.startDate).toLocaleDateString()} -{" "}
                  {challenge.endDate
                    ? new Date(challenge.endDate).toLocaleDateString()
                    : "No end date"}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Add Progress
              </h2>
              <EntryForm
                challengeId={challenge.id}
                onEntryAdded={fetchEntries}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Entries
              </h2>
              {entries.length === 0 ? (
                <p className="text-gray-500">No entries yet</p>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {formatDate(entry.date)}
                          </p>
                          <p className="text-gray-600">
                            Value: {entry.value} {challenge.unit}
                          </p>
                          {entry.notes && (
                            <p className="text-gray-600 mt-2">
                              Notes: {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
