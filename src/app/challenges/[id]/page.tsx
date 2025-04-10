"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Challenge, ChallengeEntry } from "@/types";
import { EntryForm } from "@/components/EntryForm";

export default function ChallengePage() {
  const params = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/entries`);
      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/challenges/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch challenge");
        }
        const data = await response.json();
        setChallenge(data);
        await fetchEntries();
      } catch (err) {
        setError("Failed to load challenge");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading challenge...</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error || "Challenge not found"}</p>
      </div>
    );
  }

  return (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              <p className="text-gray-600">
                <span className="font-medium">Type:</span> {challenge.type}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Target:</span> {challenge.target}{" "}
                {challenge.unit}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Frequency:</span>{" "}
                {challenge.frequency}
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
              <p className="text-gray-600">
                <span className="font-medium">Started:</span>{" "}
                {formatDate(challenge.startDate)}
              </p>
              {challenge.endDate && (
                <p className="text-gray-600">
                  <span className="font-medium">Ends:</span>{" "}
                  {formatDate(challenge.endDate)}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Progress Tracking
            </h2>
            <div className="space-y-6">
              <EntryForm
                challengeId={challenge.id}
                onEntryAdded={fetchEntries}
              />

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Entries
                </h3>
                {entries.length === 0 ? (
                  <p className="text-gray-600">
                    No entries yet. Start tracking your progress!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {formatDate(entry.date)}
                          </p>
                          <p className="text-gray-600">{entry.notes}</p>
                        </div>
                        <div className="text-xl font-semibold">
                          {entry.value} {challenge.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
