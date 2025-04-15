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
        console.log("Fetching challenge with ID:", params.id);
        const response = await fetch(`/api/challenges/${params.id}`);
        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`Failed to fetch challenge: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Challenge data from API:", data);

        // Ensure incrementValue is set correctly
        if (
          (!data.incrementValue && data.incrementValue !== 0) ||
          data.incrementValue === null
        ) {
          console.error(
            "Missing or null incrementValue in API response:",
            data
          );

          // Try to fix missing incrementValue on client side
          if (
            data.incrementPerDay !== undefined &&
            data.incrementPerDay !== null
          ) {
            console.log("Found incrementPerDay, adapting to incrementValue");
            data.incrementValue = data.incrementPerDay;
          } else if (
            data.is_incremental &&
            data.increment_value !== undefined
          ) {
            // Try database field names directly
            console.log("Found DB field increment_value, adapting");
            data.incrementValue = data.increment_value;
          } else if (
            data.is_incremental &&
            data.increment_per_day !== undefined
          ) {
            // Try legacy DB field names
            console.log("Found DB field increment_per_day, adapting");
            data.incrementValue = data.increment_per_day;
          } else {
            console.log("Setting default incrementValue = 1");
            data.incrementValue = 1; // Sensible default
          }
        }

        console.log(
          `Challenge after fixing: baseValue=${data.baseValue}, incrementValue=${data.incrementValue}, frequency=${data.frequency}`
        );

        setChallenge(data);
      } catch (err) {
        console.error("Error in fetchChallenge:", err);
        setError("Failed to load challenge");
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
      console.log("Refreshing entries list after adding entry");
      const response = await fetch(`/api/challenges/${params.id}/entries`, {
        cache: "no-store", // Ensure we're not getting cached data
        headers: {
          "Cache-Control": "no-cache",
        },
        credentials: "include", // Include auth cookies
      });

      if (!response.ok) {
        console.error("Failed to fetch entries after adding entry");
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} entries after adding entry`);
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

      // Calculate time units based on frequency
      const diffTime = Math.max(0, targetDate.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let units = 0;

      if (challenge.frequency === "daily") {
        units = diffDays;
      } else if (challenge.frequency === "weekly") {
        units = Math.floor(diffDays / 7);
      } else if (challenge.frequency === "monthly") {
        // Approximate months by getting the difference in months between dates
        const startMonth = startDate.getMonth();
        const targetMonth = targetDate.getMonth();
        const startYear = startDate.getFullYear();
        const targetYear = targetDate.getFullYear();

        units = (targetYear - startYear) * 12 + (targetMonth - startMonth);

        // Adjust for day of month (if we haven't reached same day in the month, subtract 1)
        if (targetDate.getDate() < startDate.getDate()) {
          units -= 1;
        }

        // Make sure we don't go negative
        units = Math.max(0, units);
      }

      console.log(
        `Frequency units difference: ${units} ${challenge.frequency} periods`
      );

      // Calculate target
      const baseValue = challenge.baseValue || 1; // Default to 1 if not set
      const incrementValue = challenge.incrementValue || 1; // Default to 1 if not set
      const target = baseValue + units * incrementValue;
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
    console.log(`Total days in challenge: ${totalDays}`);

    if (!challenge.isIncremental) {
      console.log(
        `Non-incremental challenge, target: ${challenge.target} x ${totalDays} days`
      );
      return challenge.target * totalDays;
    } else {
      // For incremental challenges, sum all periodic targets
      let total = 0;

      console.log(`Challenge data used for calculations:`, {
        id: challenge.id,
        isIncremental: challenge.isIncremental,
        baseValue: challenge.baseValue,
        incrementValue: challenge.incrementValue,
        frequency: challenge.frequency,
      });

      const baseValue = challenge.baseValue || 1; // Default to 1 if not set
      const incrementValue = challenge.incrementValue || 1; // Default to 1 if not set

      console.log(
        `Using baseValue: ${baseValue}, incrementValue: ${incrementValue}`
      );

      // Calculate total based on frequency
      if (challenge.frequency === "daily") {
        console.log(`Daily frequency calculation for ${totalDays} days`);
        // Sum daily targets
        for (let i = 0; i < totalDays; i++) {
          const dailyTarget = baseValue + i * incrementValue;
          total += dailyTarget;
          if (i < 5 || i > totalDays - 5) {
            console.log(`Day ${i + 1} target: ${dailyTarget}`);
          } else if (i === 5) {
            console.log(`... (omitting days 6 through ${totalDays - 4})`);
          }
        }
      } else if (challenge.frequency === "weekly") {
        // Calculate total weeks
        const totalWeeks = Math.ceil(totalDays / 7);
        console.log(`Weekly frequency calculation for ${totalWeeks} weeks`);
        for (let i = 0; i < totalWeeks; i++) {
          const weeklyTarget = baseValue + i * incrementValue;
          total += weeklyTarget;
          console.log(`Week ${i + 1} target: ${weeklyTarget}`);
        }

        // Multiply by 7 for daily total
        console.log(`Total before daily adjustment: ${total}`);
        total *= 7;
        console.log(`Total after multiplying by 7 days per week: ${total}`);
      } else if (challenge.frequency === "monthly") {
        // Approximate number of months
        const startDate = new Date(challenge.startDate);
        let endDate = challenge.endDate
          ? new Date(challenge.endDate)
          : new Date();

        console.log(
          `Monthly calculation from ${startDate.toISOString()} to ${endDate.toISOString()}`
        );

        const monthDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          endDate.getMonth() -
          startDate.getMonth() +
          (endDate.getDate() >= startDate.getDate() ? 0 : -1);

        const totalMonths = Math.max(1, monthDiff);
        console.log(`Calculated ${totalMonths} months in the challenge period`);

        for (let i = 0; i < totalMonths; i++) {
          const monthlyTarget = baseValue + i * incrementValue;
          total += monthlyTarget;
          console.log(`Month ${i + 1} target: ${monthlyTarget}`);
        }

        // Calculate average days per month for more accurate totals
        const avgDaysPerMonth = totalDays / totalMonths;
        console.log(`Average days per month: ${avgDaysPerMonth}`);
        console.log(`Total before daily adjustment: ${total}`);
        total *= avgDaysPerMonth;
        console.log(`Total after daily adjustment: ${total}`);
      }

      console.log(`Final calculated total goal: ${total}`);
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

      // Check if today is before the start date
      if (todayDate < startDate) {
        // If today is before the start date, return 0 to indicate no progress is expected
        console.log(
          "Today is before the challenge start date. Expected progress: 0"
        );
        return 0;
      }

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
      // For incremental challenges, sum targets based on frequency
      let total = 0;
      const baseValue = challenge.baseValue || 1; // Default to 1 if not set
      const incrementValue = challenge.incrementValue || 1; // Default to 1 if not set

      if (challenge.frequency === "daily") {
        // Sum daily targets up to current day
        for (let i = 0; i < currentDay; i++) {
          total += baseValue + i * incrementValue;
        }
      } else if (challenge.frequency === "weekly") {
        // Calculate current weeks
        const currentWeeks = Math.ceil(currentDay / 7);
        for (let i = 0; i < currentWeeks; i++) {
          total += baseValue + i * incrementValue;
        }
        // Multiply by min(7, remaining days) for the current partial week
        const daysInLastWeek = Math.min(7, currentDay % 7 || 7);
        total =
          (total - (baseValue + (currentWeeks - 1) * incrementValue)) * 7 +
          (baseValue + (currentWeeks - 1) * incrementValue) * daysInLastWeek;
      } else if (challenge.frequency === "monthly") {
        // Calculate months since start
        const startDate = new Date(challenge.startDate);
        const today = new Date();

        const monthDiff =
          (today.getFullYear() - startDate.getFullYear()) * 12 +
          today.getMonth() -
          startDate.getMonth() +
          (today.getDate() >= startDate.getDate() ? 0 : -1);

        const currentMonths = Math.max(0, monthDiff);

        // Calculate goal for completed months
        for (let i = 0; i < currentMonths; i++) {
          total += baseValue + i * incrementValue;
        }

        // Determine days in current month
        total *= currentDay / Math.max(currentMonths, 1);
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
    <div className="max-w-4xl mx-auto p-4 py-8 animate-fade-in">
      <div className="card mb-8 border-l-4 border-l-primary overflow-hidden">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {challenge.title}
            </h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-info">{challenge.type}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">
                {challenge.frequency}
              </span>
            </div>
            <p className="text-gray-600 max-w-2xl">{challenge.description}</p>
          </div>
          <div className="flex md:flex-col gap-3 mt-2 md:mt-0">
            <button
              onClick={() => router.push(`/challenges/${challenge.id}/edit`)}
              className="btn-secondary py-1.5 text-sm flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="icon-xs mr-1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger py-1.5 text-sm flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="icon-xs mr-1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Target</h3>
            <p className="text-lg font-semibold text-gray-900">
              {challenge.isIncremental
                ? `${challenge.baseValue} ${challenge.unit} + ${
                    challenge.incrementValue
                  } ${challenge.unit} per ${challenge.frequency
                    .toLowerCase()
                    .slice(0, -2)}`
                : `${challenge.target} ${challenge.unit}`}
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Frequency
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {challenge.frequency}
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(challenge.startDate)} -{" "}
              {challenge.endDate ? formatDate(challenge.endDate) : "Ongoing"}
            </p>
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-sm mr-2 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          Challenge Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-5 rounded-lg transition-normal hover:shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Challenge Goal
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {getTotalGoal().toLocaleString()} {challenge.unit}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Over {getTotalDays()} days
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg transition-normal hover:shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2 text-center md:text-left">
              Total Progress
            </h3>
            <div className="flex items-end justify-center md:justify-start">
              <p className="text-2xl font-bold text-gray-900">
                {getTotalProgress().toLocaleString()} {challenge.unit}
              </p>
              <span className="text-sm font-normal text-gray-500 ml-2 mb-1">
                ({((getTotalProgress() / getTotalGoal()) * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((getTotalProgress() / getTotalGoal()) * 100)
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg transition-normal hover:shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2 text-center md:text-left">
              Expected Progress (Day {getCurrentDay()} of {getTotalDays()})
            </h3>
            <p className="text-2xl font-bold text-gray-900 text-center md:text-left">
              {getGoalSoFar().toLocaleString()} {challenge.unit}
            </p>
            <p className="text-xs text-gray-500 mt-1 text-center md:text-left">
              {((getGoalSoFar() / getTotalGoal()) * 100).toFixed(2)}% of total
              goal
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-gray-400 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (getGoalSoFar() / getTotalGoal()) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg transition-normal hover:shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2 text-center md:text-left">
              Current Standing
            </h3>
            {(() => {
              const diff = getTotalProgress() - getGoalSoFar();
              const goalSoFar = getGoalSoFar();
              // Avoid division by zero
              const diffPercentage =
                goalSoFar > 0 ? ((diff / goalSoFar) * 100).toFixed(2) : "0.00";

              if (diff > 0) {
                return (
                  <>
                    <div className="flex items-center justify-center md:justify-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="icon-sm mr-2 text-secondary"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                        />
                      </svg>
                      <p className="text-2xl font-bold text-secondary">
                        +{diff.toLocaleString()} {challenge.unit}
                        <span className="text-sm font-normal ml-2">
                          ({diffPercentage}% ahead)
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-secondary-dark mt-2 font-medium text-center md:text-left">
                      You're ahead of schedule! Keep up the good work!
                    </p>
                  </>
                );
              } else if (diff < 0) {
                return (
                  <>
                    <div className="flex items-center justify-center md:justify-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="icon-sm mr-2 text-error"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"
                        />
                      </svg>
                      <p className="text-2xl font-bold text-error">
                        {diff.toLocaleString()} {challenge.unit}
                        <span className="text-sm font-normal ml-2">
                          ({Math.abs(Number(diffPercentage))}% behind)
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-red-600 mt-2 font-medium text-center md:text-left">
                      You need to catch up to meet your goal
                    </p>
                  </>
                );
              } else {
                return (
                  <>
                    <div className="flex items-center justify-center md:justify-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="icon-sm mr-2 text-primary"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                        />
                      </svg>
                      <p className="text-2xl font-bold text-primary">
                        On track
                        <span className="text-sm font-normal ml-2">
                          (Exactly on schedule)
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-primary-dark mt-2 font-medium text-center md:text-left">
                      Keep up the good work!
                    </p>
                  </>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Add Progress Section */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-sm mr-2 text-accent"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Progress
        </h2>
        <EntryForm
          challengeId={challenge.id}
          onEntryAdded={handleEntryAdded}
          challenge={challenge}
        />
      </div>

      {/* Progress History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-sm mr-2 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
          Progress History
        </h2>

        {entries.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="icon-lg mx-auto text-gray-400 mb-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-gray-500 text-lg">No entries yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add your first progress entry above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-normal"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="font-medium text-gray-900">
                        {formatDate(entry.date)}
                      </p>
                      {entry.value >= getCurrentTarget(entry.date) && (
                        <span className="badge badge-success">Target Met</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Value: {entry.value} {challenge.unit}
                    </p>
                    {entry.notes && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-100">
                        <p className="text-sm text-gray-600">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center md:items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            entry.value >= getCurrentTarget(entry.date)
                              ? "bg-secondary"
                              : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (entry.value / getCurrentTarget(entry.date)) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {(
                          (entry.value / getCurrentTarget(entry.date)) *
                          100
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 text-center md:text-right">
                      {entry.value}/{getCurrentTarget(entry.date)} of daily
                      target
                    </p>
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="text-xs text-primary hover:text-primary-dark flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="icon-xs mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      Edit
                    </button>
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="icon-sm mr-2 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Edit Entry
              </h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="icon-md"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-5 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(editingEntry.date)}
              </p>
            </div>

            <div className="mb-5">
              <label className="label">Value</label>
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
                className="input"
              />
            </div>

            <div className="mb-5">
              <label className="label">Notes</label>
              <textarea
                value={editingEntry.notes || ""}
                onChange={(e) =>
                  setEditingEntry({
                    ...editingEntry,
                    notes: e.target.value,
                  })
                }
                className="input"
                rows={3}
                placeholder="Add notes about this entry (optional)"
              />
            </div>

            {editEntryError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="icon-xs mr-1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  {editEntryError}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-6">
              <button
                onClick={deleteEntry}
                className="btn-danger flex items-center justify-center disabled:opacity-50 py-2 order-2 sm:order-1"
                disabled={editEntryLoading}
              >
                {editEntryLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="icon-xs mr-1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                )}
                {editEntryLoading ? "Deleting..." : "Delete Entry"}
              </button>

              <div className="flex justify-end space-x-3 order-1 sm:order-2">
                <button
                  onClick={closeEditModal}
                  className="btn-secondary disabled:opacity-50 py-2"
                  disabled={editEntryLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedEntry}
                  className="btn-primary flex items-center justify-center disabled:opacity-50 py-2"
                  disabled={editEntryLoading}
                >
                  {editEntryLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="icon-xs mr-1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="icon-sm mr-2 text-error"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              Delete Challenge
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this challenge? This action cannot
              be undone, and all associated entries will be deleted.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary disabled:opacity-50 py-2"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex items-center justify-center disabled:opacity-50 py-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="icon-xs mr-1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                )}
                {isDeleting ? "Deleting..." : "Delete Challenge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
