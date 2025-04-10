"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Challenge, ChallengeEntry } from "@/types";
import { EntryForm } from "@/components/EntryForm";
import ProtectedRoute from "@/components/ProtectedRoute";

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
        const response = await fetch(`/api/challenges/${params.id}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
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
  }, [params.id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-500 text-center">
              {error || "Challenge not found"}
            </p>
          </div>
        </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Details</h2>
                <p className="text-gray-600">
                  <span className="font-medium">Type:</span> {challenge.type}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Target:</span>{" "}
                  {challenge.target} {challenge.unit}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Frequency:</span>{" "}
                  {challenge.frequency}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Timeline
                </h2>
                <p className="text-gray-600">
                  <span className="font-medium">Start Date:</span>{" "}
                  {formatDate(challenge.startDate)}
                </p>
                {challenge.endDate && (
                  <p className="text-gray-600">
                    <span className="font-medium">End Date:</span>{" "}
                    {formatDate(challenge.endDate)}
                  </p>
                )}
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
