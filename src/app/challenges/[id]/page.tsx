"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Challenge, ChallengeEntry } from "@/types";
import { EntryForm } from "@/components/EntryForm";
import { deleteChallenge } from "@/lib/api";

export default function ChallengeDetail() {
  const params = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChallengeEntry | null>(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryError, setEditEntryError] = useState<string | null>(null);
  const [editEntryLoading, setEditEntryLoading] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/challenges/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch challenge");
        }
        const data = await response.json();
        console.log("Challenge data from API:", data);
        setChallenge(data);
      } catch (err) {
        setError("Failed to load challenge");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchEntries = async () => {
      try {
        const response = await fetch(`/api/challenges/${params.id}/entries`);
        if (!response.ok) {
          throw new Error("Failed to fetch entries");
        }
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load entries:", err);
      }
    };

    fetchChallenge();
    fetchEntries();
  }, [params.id]);

  const handleEntryAdded = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/entries`, {
        cache: "no-store", // Ensure we're not getting cached data
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load entries:", err);
    }
  };

  const getCurrentTarget = (date: string) => {
    if (!challenge) return 0;
    if (!challenge.isIncremental) return challenge.target;

    try {
      console.log(`Getting target for date: ${date}`);

      // Get date strings in YYYY-MM-DD format
      const startDateStr = challenge.startDate.split("T")[0];
      const dateStr = date.split("T")[0];

      console.log(`Start date: ${startDateStr}, Target date: ${dateStr}`);

      // Parse date components
      const [startYear, startMonth, startDay] = startDateStr
        .split("-")
        .map(Number);
      const [year, month, day] = dateStr.split("-").map(Number);

      // Create date objects and force them to UTC to avoid timezone issues
      const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      const targetDate = new Date(Date.UTC(year, month - 1, day));

      console.log(
        `Start date obj: ${startDate.toISOString()}, Target date obj: ${targetDate.toISOString()}`
      );

      // Calculate day difference
      const diffTime = Math.max(0, targetDate.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      console.log(`Day difference: ${diffDays}`);

      // Calculate target
      const target = challenge.baseValue + diffDays * challenge.incrementPerDay;
      console.log(`Calculated target: ${target}`);

      return target;
    } catch (error) {
      console.error("Error calculating target:", error);
      return challenge.target;
    }
  };

  function formatDate(dateString: string) {
    if (!dateString) return "Unknown";

    try {
      // Split by T to handle both ISO strings and date-only strings
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);

      // Create a date at noon to avoid any potential timezone issues
      // This ensures we're working with the same date regardless of timezone
      const date = new Date(year, month - 1, day, 12, 0, 0);

      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid Date";
    }
  }

  const handleDelete = async () => {
    if (!challenge) return;

    try {
      setIsDeleting(true);
      await deleteChallenge(challenge.id);
      router.push("/challenges");
    } catch (err) {
      console.error("Error deleting challenge:", err);
      setError("Failed to delete challenge");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditEntry = (entry: ChallengeEntry) => {
    setEditingEntry(entry);
    setIsEditingEntry(true);
    setEditEntryError(null);
  };

  const closeEditModal = () => {
    setIsEditingEntry(false);
    setEditingEntry(null);
    setEditEntryError(null);
  };

  const saveEditedEntry = async () => {
    if (!editingEntry || !challenge) return;

    setEditEntryLoading(true);
    setEditEntryError(null);

    try {
      const response = await fetch(
        `/api/challenges/${params.id}/entries/${editingEntry.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: editingEntry.value,
            notes: editingEntry.notes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update entry");
      }

      // Refresh entries list
      await handleEntryAdded();
      closeEditModal();
    } catch (err) {
      console.error("Error updating entry:", err);
      setEditEntryError(
        err instanceof Error ? err.message : "Failed to update entry"
      );
    } finally {
      setEditEntryLoading(false);
    }
  };

  // Add the delete entry function
  const deleteEntry = async () => {
    if (!editingEntry || !challenge) return;

    setEditEntryLoading(true);
    setEditEntryError(null);

    try {
      const response = await fetch(
        `/api/challenges/${params.id}/entries/${editingEntry.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete entry");
      }

      // Refresh entries list
      await handleEntryAdded();
      closeEditModal();
    } catch (err) {
      console.error("Error deleting entry:", err);
      setEditEntryError(
        err instanceof Error ? err.message : "Failed to delete entry"
      );
    } finally {
      setEditEntryLoading(false);
    }
  };

  // Calculate total days in the challenge
  const getTotalDays = () => {
    if (!challenge) return 0;

    const startDate = new Date(challenge.startDate);
    const endDate = challenge.endDate
      ? new Date(challenge.endDate)
      : new Date();

    // Set to UTC dates to avoid timezone issues
    const startUTC = Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const endUTC = Date.UTC(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    return Math.ceil((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end date
  };

  // Calculate the total goal for the entire challenge
  const getTotalGoal = () => {
    if (!challenge) return 0;

    const totalDays = getTotalDays();

    if (!challenge.isIncremental) {
      return challenge.target * totalDays;
    } else {
      // For incremental challenges, sum all daily targets
      let total = 0;
      for (let i = 0; i < totalDays; i++) {
        const baseValue = challenge.baseValue || 1; // Default to 1 if not set
        const incrementPerDay = challenge.incrementPerDay || 1; // Default to 1 if not set
        total += baseValue + i * incrementPerDay;
      }
      return total;
    }
  };

  // Calculate current day of the challenge
  const getCurrentDay = () => {
    if (!challenge) return 0;

    try {
      // Get date strings in YYYY-MM-DD format
      const startDateStr = challenge.startDate.split("T")[0];

      // Get today's date in the same format
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      console.log(`Start date: ${startDateStr}, Today: ${todayStr}`);

      // Parse date components
      const [startYear, startMonth, startDay] = startDateStr
        .split("-")
        .map(Number);
      const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);

      // Create date objects with consistent time (noon UTC)
      const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      const todayDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));

      console.log(
        `Start date obj: ${startDate.toISOString()}, Today obj: ${todayDate.toISOString()}`
      );

      // Calculate days difference (add 1 to include the start day)
      const diffTime = Math.max(0, todayDate.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      console.log(`Day difference (including today): ${diffDays}`);

      // Make sure we don't exceed the total days in the challenge
      return Math.min(diffDays, getTotalDays());
    } catch (error) {
      console.error("Error calculating current day:", error);
      return 1; // Default to day 1 if calculation fails
    }
  };

  // Calculate the goal so far (up to today)
  const getGoalSoFar = () => {
    if (!challenge) return 0;

    const currentDay = getCurrentDay();

    if (!challenge.isIncremental) {
      return challenge.target * currentDay;
    } else {
      // For incremental challenges, sum daily targets up to current day
      let total = 0;
      for (let i = 0; i < currentDay; i++) {
        const baseValue = challenge.baseValue || 1; // Default to 1 if not set
        const incrementPerDay = challenge.incrementPerDay || 1; // Default to 1 if not set
        total += baseValue + i * incrementPerDay;
      }
      return total;
    }
  };

  // Calculate total progress from all entries
  const getTotalProgress = () => {
    if (!entries.length) return 0;
    return entries.reduce((sum, entry) => sum + entry.value, 0);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {challenge.title}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/challenges/${challenge.id}/edit`)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{challenge.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Challenge Details
            </h2>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900">{challenge.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                <dd className="text-sm text-gray-900">{challenge.frequency}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Target</dt>
                <dd className="text-sm text-gray-900">
                  {challenge.isIncremental
                    ? `${challenge.baseValue} ${challenge.unit} + ${challenge.incrementPerDay} ${challenge.unit}/day`
                    : `${challenge.target} ${challenge.unit}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="text-sm text-gray-900">
                  {challenge.startDate
                    ? formatDate(challenge.startDate)
                    : "Unknown"}{" "}
                  -{" "}
                  {challenge.endDate
                    ? formatDate(challenge.endDate)
                    : "Ongoing"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Challenge Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Total Challenge Goal
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalGoal().toLocaleString()} {challenge.unit}
              </p>
              <p className="text-xs text-gray-500">
                Over {getTotalDays()} days
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Total Progress
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalProgress().toLocaleString()} {challenge.unit}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({Math.round((getTotalProgress() / getTotalGoal()) * 100)}%)
                </span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((getTotalProgress() / getTotalGoal()) * 100)
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Expected Progress (Day {getCurrentDay()} of {getTotalDays()})
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {getGoalSoFar().toLocaleString()} {challenge.unit}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round((getGoalSoFar() / getTotalGoal()) * 100)}% of total
                goal
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Current Standing
              </h3>
              {(() => {
                const diff = getTotalProgress() - getGoalSoFar();
                const goalSoFar = getGoalSoFar();
                // Avoid division by zero
                const diffPercentage =
                  goalSoFar > 0 ? Math.round((diff / goalSoFar) * 100) : 0;

                if (diff > 0) {
                  return (
                    <>
                      <p className="text-2xl font-bold text-green-600">
                        +{diff.toLocaleString()} {challenge.unit}
                        <span className="text-sm font-normal ml-2">
                          ({diffPercentage}% ahead)
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        You're ahead of schedule!
                      </p>
                    </>
                  );
                } else if (diff < 0) {
                  return (
                    <>
                      <p className="text-2xl font-bold text-red-600">
                        {diff.toLocaleString()} {challenge.unit}
                        <span className="text-sm font-normal ml-2">
                          ({Math.abs(diffPercentage)}% behind)
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        You need to catch up
                      </p>
                    </>
                  );
                } else {
                  return (
                    <>
                      <p className="text-2xl font-bold text-gray-600">
                        On track
                        <span className="text-sm font-normal ml-2">
                          (Exactly on schedule)
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Keep up the good work!
                      </p>
                    </>
                  );
                }
              })()}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add Progress
          </h2>
          <EntryForm
            challengeId={challenge.id}
            onEntryAdded={handleEntryAdded}
            challenge={challenge}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Progress History
          </h2>
          {entries.length === 0 ? (
            <p className="text-gray-500">No entries yet</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(entry.date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Value: {entry.value} {challenge.unit}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-medium text-gray-900">
                          {entry.value}/{getCurrentTarget(entry.date)}{" "}
                          <span className="text-gray-500">
                            (
                            {(
                              (entry.value / getCurrentTarget(entry.date)) *
                              100
                            ).toFixed(0)}
                            %)
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">of daily target</p>
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Entry Modal */}
        {isEditingEntry && editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Entry</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-medium">{formatDate(editingEntry.date)}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={editingEntry.value}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      value: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingEntry.notes || ""}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              {editEntryError && (
                <p className="text-red-500 text-sm mb-4">{editEntryError}</p>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={deleteEntry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={editEntryLoading}
                >
                  {editEntryLoading ? "Deleting..." : "Delete Entry"}
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    disabled={editEntryLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedEntry}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={editEntryLoading}
                  >
                    {editEntryLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Delete Challenge</h2>
              <p className="mb-6">
                Are you sure you want to delete this challenge? This action
                cannot be undone, and all associated entries will be deleted.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Challenge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
