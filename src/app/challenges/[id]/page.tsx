"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Challenge, ChallengeEntry } from "@/types";
import { EntryForm } from "@/components/EntryForm";
import { deleteChallenge } from "@/lib/api";
import GoalView from "@/components/GoalView";
import { formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  const [showVisualization, setShowVisualization] = useState(false);

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
            data.incrementValue = Number(data.incrementPerDay); // Ensure it's a number
          } else if (
            data.is_incremental &&
            data.increment_value !== undefined
          ) {
            // Try database field names directly
            console.log("Found DB field increment_value, adapting");
            data.incrementValue = Number(data.increment_value); // Ensure it's a number
          } else if (
            data.is_incremental &&
            data.increment_per_day !== undefined
          ) {
            // Try legacy DB field names
            console.log("Found DB field increment_per_day, adapting");
            data.incrementValue = Number(data.increment_per_day); // Ensure it's a number
          } else {
            console.log("Setting default incrementValue = 1");
            data.incrementValue = 1; // Sensible default
          }
        } else {
          // Make sure incrementValue is a number even if it's provided
          data.incrementValue = Number(data.incrementValue);
        }

        // Also ensure baseValue is a number
        if (
          (!data.baseValue && data.baseValue !== 0) ||
          data.baseValue === null
        ) {
          data.baseValue = data.base_value || 1;
        }
        data.baseValue = Number(data.baseValue);

        console.log(
          `Challenge after fixing: baseValue=${
            data.baseValue
          } (${typeof data.baseValue}), incrementValue=${
            data.incrementValue
          } (${typeof data.incrementValue}), frequency=${data.frequency}`
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

      // If target date is before start date, return 0
      if (targetDate < startDate) {
        console.log("Target date is before challenge start date. Target: 0");
        return 0;
      }

      // Calculate time units based on frequency
      const diffTime = Math.max(0, targetDate.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let units = 0;

      if (challenge.frequency.toLowerCase() === "daily") {
        units = diffDays;
      } else if (challenge.frequency.toLowerCase() === "weekly") {
        units = Math.floor(diffDays / 7);
      } else if (challenge.frequency.toLowerCase() === "monthly") {
        // Calculate number of months
        const startDate = new Date(challenge.startDate);
        let endDate = challenge.endDate
          ? new Date(challenge.endDate)
          : new Date();

        // For month calculation, we need to be careful:
        // For a Jan 1 - Dec 31 challenge, we should count exactly 12 months
        const monthDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          endDate.getMonth() -
          startDate.getMonth();

        // Include the end month only if it's at least the same day of month or later
        // This ensures Jan 1 - Dec 31 = 12 months (not 13)
        const totalMonths = Math.max(
          1,
          monthDiff + (endDate.getDate() >= startDate.getDate() ? 1 : 0)
        );

        console.log(
          `Monthly calculation from ${startDate.toISOString()} to ${endDate.toISOString()}, totalMonths: ${totalMonths}`
        );

        return challenge.target * totalMonths;
      }

      console.log(
        `Frequency units difference: ${units} ${challenge.frequency} periods`
      );

      // Calculate target - force numeric types
      const baseValue =
        typeof challenge.baseValue === "number"
          ? challenge.baseValue
          : Number(challenge.baseValue || 1);
      const incrementValue =
        typeof challenge.incrementValue === "number"
          ? challenge.incrementValue
          : Number(challenge.incrementValue || 1);

      console.log(
        `Using baseValue: ${baseValue} (${typeof baseValue}), incrementValue: ${incrementValue} (${typeof incrementValue})`
      );

      // For day 0 (start date), the target should be just the baseValue
      // Only apply increments for days after the start date
      const target = baseValue + units * incrementValue;
      console.log(`Calculated target: ${target}`);

      return target;
    } catch (error) {
      console.error("Error calculating target:", error);
      return challenge.target;
    }
  };

  const formatDate = (dateString: string) => {
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
  };

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

  // Get the number of time periods in the appropriate unit
  const getTotalTimePeriodsInUnit = () => {
    if (!challenge) return 0;

    const totalDays = getTotalDays();

    if (challenge.frequency.toLowerCase() === "daily") {
      return totalDays;
    } else if (challenge.frequency.toLowerCase() === "weekly") {
      return Math.ceil(totalDays / 7);
    } else if (challenge.frequency.toLowerCase() === "monthly") {
      // Calculate number of months
      const startDate = new Date(challenge.startDate);
      let endDate = challenge.endDate
        ? new Date(challenge.endDate)
        : new Date();

      const monthDiff =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() -
        startDate.getMonth();

      // Include the end month only if it's at least the same day of month or later
      return Math.max(
        1,
        monthDiff + (endDate.getDate() >= startDate.getDate() ? 1 : 0)
      );
    }

    return totalDays; // Fallback to days if frequency is unknown
  };

  // Get the appropriate time unit label based on frequency
  const getTimeUnitLabel = () => {
    if (!challenge) return "days";

    const count = getTotalTimePeriodsInUnit();
    const frequency = challenge.frequency.toLowerCase();

    if (frequency === "daily") {
      return count === 1 ? "day" : "days";
    } else if (frequency === "weekly") {
      return count === 1 ? "week" : "weeks";
    } else if (frequency === "monthly") {
      return count === 1 ? "month" : "months";
    }

    return "days"; // Fallback
  };

  // Get the appropriate target unit label based on frequency (singular)
  const getTargetUnitLabel = () => {
    if (!challenge) return "daily";

    const frequency = challenge.frequency.toLowerCase();

    if (frequency === "daily") {
      return "daily";
    } else if (frequency === "weekly") {
      return "weekly";
    } else if (frequency === "monthly") {
      return "monthly";
    }

    return "daily"; // Fallback
  };

  // Get the current time period (day/week/month) in the appropriate unit
  const getCurrentTimePeriodInUnit = () => {
    if (!challenge) return 0;

    const currentDay = getCurrentDay();

    if (challenge.frequency.toLowerCase() === "daily") {
      return currentDay;
    } else if (challenge.frequency.toLowerCase() === "weekly") {
      return Math.ceil(currentDay / 7);
    } else if (challenge.frequency.toLowerCase() === "monthly") {
      // Calculate months from start to today
      const startDate = new Date(challenge.startDate);
      const today = new Date();

      // For month calculation, we need to be careful not to double-count
      const monthDiff =
        (today.getFullYear() - startDate.getFullYear()) * 12 +
        today.getMonth() -
        startDate.getMonth();

      // Include current month only if we're at/past the same day of month
      return Math.max(
        1,
        monthDiff + (today.getDate() >= startDate.getDate() ? 1 : 0)
      );
    }

    return currentDay; // Fallback to days if frequency is unknown
  };

  // Get the appropriate time period label based on frequency (singular form)
  const getTimePeriodLabel = () => {
    if (!challenge) return "Day";

    const frequency = challenge.frequency.toLowerCase();

    if (frequency === "daily") {
      return "Day";
    } else if (frequency === "weekly") {
      return "Week";
    } else if (frequency === "monthly") {
      return "Month";
    }

    return "Day"; // Fallback
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

  // Calculate the total goal for the entire challenge
  const getTotalGoal = () => {
    if (!challenge) return 0;

    const totalDays = getTotalDays();
    console.log(`Total days in challenge: ${totalDays}`);

    if (!challenge.isIncremental) {
      console.log(
        `Non-incremental challenge, target: ${challenge.target} x ${totalDays} days`
      );
      // For non-incremental challenges, adjust based on frequency
      if (challenge.frequency.toLowerCase() === "daily") {
        return challenge.target * totalDays;
      } else if (challenge.frequency.toLowerCase() === "weekly") {
        const totalWeeks = Math.ceil(totalDays / 7);
        return challenge.target * totalWeeks;
      } else if (challenge.frequency.toLowerCase() === "monthly") {
        // Calculate number of months
        const startDate = new Date(challenge.startDate);
        let endDate = challenge.endDate
          ? new Date(challenge.endDate)
          : new Date();

        // For month calculation, we need to be careful:
        // For a Jan 1 - Dec 31 challenge, we should count exactly 12 months
        const monthDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          endDate.getMonth() -
          startDate.getMonth();

        // Include the end month only if it's at least the same day of month or later
        // This ensures Jan 1 - Dec 31 = 12 months (not 13)
        const totalMonths = Math.max(
          1,
          monthDiff + (endDate.getDate() >= startDate.getDate() ? 1 : 0)
        );

        console.log(
          `Monthly calculation from ${startDate.toISOString()} to ${endDate.toISOString()}, totalMonths: ${totalMonths}`
        );

        return challenge.target * totalMonths;
      }
      return challenge.target * totalDays; // fallback
    } else {
      // For incremental challenges, sum all periodic targets
      let total = 0;

      console.log(`Challenge data used for calculations:`, {
        id: challenge.id,
        isIncremental: challenge.isIncremental,
        baseValue:
          typeof challenge.baseValue === "number"
            ? challenge.baseValue
            : Number(challenge.baseValue || 1),
        incrementValue:
          typeof challenge.incrementValue === "number"
            ? challenge.incrementValue
            : Number(challenge.incrementValue || 1),
        frequency: challenge.frequency,
      });

      // Force numeric values with defaults
      const baseValue =
        typeof challenge.baseValue === "number"
          ? challenge.baseValue
          : Number(challenge.baseValue || 1);
      const incrementValue =
        typeof challenge.incrementValue === "number"
          ? challenge.incrementValue
          : Number(challenge.incrementValue || 1);

      console.log(
        `Using baseValue: ${baseValue} (${typeof baseValue}), incrementValue: ${incrementValue} (${typeof incrementValue})`
      );

      // Calculate total based on frequency
      if (challenge.frequency.toLowerCase() === "daily") {
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
      } else if (challenge.frequency.toLowerCase() === "weekly") {
        // Calculate total weeks
        const totalWeeks = Math.ceil(totalDays / 7);
        console.log(`Weekly frequency calculation for ${totalWeeks} weeks`);

        // Sum weekly targets (NOT daily)
        for (let i = 0; i < totalWeeks; i++) {
          const weeklyTarget = baseValue + i * incrementValue;
          total += weeklyTarget;
          console.log(`Week ${i + 1} target: ${weeklyTarget}`);
        }
      } else if (challenge.frequency.toLowerCase() === "monthly") {
        // Calculate number of months
        const startDate = new Date(challenge.startDate);
        let endDate = challenge.endDate
          ? new Date(challenge.endDate)
          : new Date();

        // For month calculation, we need to be careful:
        // For a Jan 1 - Dec 31 challenge, we should count exactly 12 months
        const monthDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          endDate.getMonth() -
          startDate.getMonth();

        // Include the end month only if it's at least the same day of month or later
        // This ensures Jan 1 - Dec 31 = 12 months (not 13)
        const totalMonths = Math.max(
          1,
          monthDiff + (endDate.getDate() >= startDate.getDate() ? 1 : 0)
        );

        console.log(
          `Monthly calculation from ${startDate.toISOString()} to ${endDate.toISOString()}, totalMonths: ${totalMonths}`
        );

        // Sum monthly targets (NOT daily)
        for (let i = 0; i < totalMonths; i++) {
          const monthlyTarget = baseValue + i * incrementValue;
          total += monthlyTarget;
          console.log(`Month ${i + 1} target: ${monthlyTarget}`);
        }
      }

      console.log(`Final calculated total goal: ${total}`);
      return total;
    }
  };

  // Calculate the goal so far (up to today)
  const getGoalSoFar = () => {
    if (!challenge) return 0;

    const currentDay = getCurrentDay();
    console.log(`Current day of challenge: ${currentDay}`);

    if (!challenge.isIncremental) {
      // For non-incremental challenges
      if (challenge.frequency.toLowerCase() === "daily") {
        console.log(
          `Non-incremental daily challenge goal so far: ${challenge.target} x ${currentDay} days`
        );
        return challenge.target * currentDay;
      } else if (challenge.frequency.toLowerCase() === "weekly") {
        const currentWeeks = Math.ceil(currentDay / 7);
        console.log(
          `Non-incremental weekly challenge goal so far: ${challenge.target} x ${currentWeeks} weeks`
        );
        return challenge.target * currentWeeks;
      } else if (challenge.frequency.toLowerCase() === "monthly") {
        // Calculate months from start to today
        const startDate = new Date(challenge.startDate);
        const today = new Date();

        // For month calculation, we need to be careful not to double-count
        const monthDiff =
          (today.getFullYear() - startDate.getFullYear()) * 12 +
          today.getMonth() -
          startDate.getMonth();

        // Include current month only if we're at/past the same day of month
        // This ensures Jan 1 - Apr 14 = 4 months (not 5), assuming today is April 14
        const currentMonths = Math.max(
          1,
          monthDiff + (today.getDate() >= startDate.getDate() ? 1 : 0)
        );

        console.log(
          `Monthly challenge progress so far: ${challenge.target} x ${currentMonths} months`
        );

        return challenge.target * currentMonths;
      }
      return challenge.target * currentDay; // fallback
    } else {
      // For incremental challenges, sum targets based on frequency
      let total = 0;

      // Force numeric values with defaults
      const baseValue =
        typeof challenge.baseValue === "number"
          ? challenge.baseValue
          : Number(challenge.baseValue || 1);
      const incrementValue =
        typeof challenge.incrementValue === "number"
          ? challenge.incrementValue
          : Number(challenge.incrementValue || 1);

      console.log(
        `Goal so far calculation using baseValue: ${baseValue} (${typeof baseValue}), incrementValue: ${incrementValue} (${typeof incrementValue})`
      );

      if (challenge.frequency.toLowerCase() === "daily") {
        // Sum daily targets up to current day
        for (let i = 0; i < currentDay; i++) {
          const dailyTarget = baseValue + i * incrementValue;
          total += dailyTarget;
          if (i < 5 || i === currentDay - 1) {
            console.log(`Day ${i + 1} target: ${dailyTarget}`);
          } else if (i === 5 && currentDay > 10) {
            console.log(`... (omitting days 6 through ${currentDay - 1})`);
          }
        }
        console.log(
          `Daily frequency, summed ${currentDay} days, total: ${total}`
        );
      } else if (challenge.frequency.toLowerCase() === "weekly") {
        // Calculate current weeks
        const currentWeeks = Math.ceil(currentDay / 7);
        console.log(`Weekly frequency, calculating for ${currentWeeks} weeks`);

        // Sum weekly targets (NOT daily)
        for (let i = 0; i < currentWeeks; i++) {
          const weeklyTarget = baseValue + i * incrementValue;
          total += weeklyTarget;
          console.log(`Week ${i + 1} target: ${weeklyTarget}`);
        }
      } else if (challenge.frequency.toLowerCase() === "monthly") {
        // Calculate months since start
        const startDate = new Date(challenge.startDate);
        const today = new Date();

        // For month calculation, we need to be careful not to double-count
        const monthDiff =
          (today.getFullYear() - startDate.getFullYear()) * 12 +
          today.getMonth() -
          startDate.getMonth();

        // Include current month only if we're at/past the same day of month
        // This ensures Jan 1 - Apr 14 = 4 months (not 5), assuming today is April 14
        const currentMonths = Math.max(
          1,
          monthDiff + (today.getDate() >= startDate.getDate() ? 1 : 0)
        );

        console.log(
          `Monthly frequency, calculating for ${currentMonths} months`
        );

        // Sum monthly targets (NOT daily)
        for (let i = 0; i < currentMonths; i++) {
          const monthlyTarget = baseValue + i * incrementValue;
          total += monthlyTarget;
          console.log(`Month ${i + 1} target: ${monthlyTarget}`);
        }
      }

      console.log(`Final goal so far: ${total}`);
      return total;
    }
  };

  // Calculate total progress from all entries
  const getTotalProgress = () => {
    if (!entries.length) return 0;
    return entries.reduce((sum, entry) => sum + entry.value, 0);
  };

  // Function to prepare data for visualization
  const prepareVisualizationData = (): {
    barChartData: Array<{
      name: string;
      "Total Goal": number;
      "Expected Progress": number;
      "Actual Progress": number;
    }>;
    lineChartData: Array<{
      date: string;
      value: number;
      expected: number;
    }>;
    pieChartData: Array<{
      name: string;
      value: number;
    }>;
    actualProgress: number;
    expectedProgress: number;
    totalGoal: number;
  } => {
    if (!challenge) {
      return {
        barChartData: [],
        lineChartData: [],
        pieChartData: [],
        actualProgress: 0,
        expectedProgress: 0,
        totalGoal: 0,
      };
    }

    const totalGoal = getTotalGoal();
    const expectedProgress = getGoalSoFar();
    const actualProgress = getTotalProgress();

    // Data for bar chart comparing goal, expected, and actual progress
    const barChartData = [
      {
        name: "Progress Comparison",
        "Total Goal": totalGoal,
        "Expected Progress": expectedProgress,
        "Actual Progress": actualProgress,
      },
    ];

    // Prepare data for line chart showing progress over time
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const lineChartData = sortedEntries.map((entry, index) => {
      // Get the previous entries' total value
      const previousTotal =
        index > 0
          ? sortedEntries.slice(0, index).reduce((sum, e) => sum + e.value, 0)
          : 0;

      // Calculate expected progress for this date
      const entryDate = new Date(entry.date);
      const startDate = new Date(challenge.startDate);

      // Calculate days from start to this entry
      const diffTime = Math.max(0, entryDate.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start day

      // Calculate expected progress proportionally based on days passed
      let expectedForDate = 0;

      if (challenge.frequency.toLowerCase() === "daily") {
        if (!challenge.isIncremental) {
          expectedForDate = challenge.target * diffDays;
        } else {
          // For incremental challenges, sum all daily targets up to this point
          for (let i = 0; i < diffDays; i++) {
            const baseValue =
              typeof challenge.baseValue === "number"
                ? challenge.baseValue
                : Number(challenge.baseValue || 1);
            const incrementValue =
              typeof challenge.incrementValue === "number"
                ? challenge.incrementValue
                : Number(challenge.incrementValue || 1);
            expectedForDate += baseValue + i * incrementValue;
          }
        }
      } else if (challenge.frequency.toLowerCase() === "weekly") {
        const currentWeeks = Math.ceil(diffDays / 7);
        if (!challenge.isIncremental) {
          expectedForDate = challenge.target * currentWeeks;
        } else {
          // For incremental challenges, sum all weekly targets up to this point
          for (let i = 0; i < currentWeeks; i++) {
            const baseValue =
              typeof challenge.baseValue === "number"
                ? challenge.baseValue
                : Number(challenge.baseValue || 1);
            const incrementValue =
              typeof challenge.incrementValue === "number"
                ? challenge.incrementValue
                : Number(challenge.incrementValue || 1);
            expectedForDate += baseValue + i * incrementValue;
          }
        }
      } else if (challenge.frequency.toLowerCase() === "monthly") {
        // Calculate months from start to this entry date
        const monthDiff =
          (entryDate.getFullYear() - startDate.getFullYear()) * 12 +
          entryDate.getMonth() -
          startDate.getMonth();
        const currentMonths = Math.max(
          1,
          monthDiff + (entryDate.getDate() >= startDate.getDate() ? 1 : 0)
        );

        if (!challenge.isIncremental) {
          expectedForDate = challenge.target * currentMonths;
        } else {
          // For incremental challenges, sum all monthly targets up to this point
          for (let i = 0; i < currentMonths; i++) {
            const baseValue =
              typeof challenge.baseValue === "number"
                ? challenge.baseValue
                : Number(challenge.baseValue || 1);
            const incrementValue =
              typeof challenge.incrementValue === "number"
                ? challenge.incrementValue
                : Number(challenge.incrementValue || 1);
            expectedForDate += baseValue + i * incrementValue;
          }
        }
      }

      return {
        date: formatDate(entry.date),
        value: previousTotal + entry.value,
        expected: expectedForDate,
      };
    });

    // Add current total as the last point if there are entries
    if (lineChartData.length > 0) {
      const lastPoint = lineChartData[lineChartData.length - 1];
      // Only add a final point if the last entry isn't today
      const today = new Date();
      const lastEntryDate = new Date(
        sortedEntries[sortedEntries.length - 1].date
      );

      if (today.toDateString() !== lastEntryDate.toDateString()) {
        lineChartData.push({
          date: "Current",
          value: actualProgress,
          expected: expectedProgress,
        });
      }
    }

    // Prepare data for pie chart showing progress percentage
    const pieChartData = [
      { name: "Completed", value: actualProgress },
      { name: "Remaining", value: Math.max(0, totalGoal - actualProgress) },
    ];

    return {
      barChartData,
      lineChartData,
      pieChartData,
      actualProgress,
      expectedProgress,
      totalGoal,
    };
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
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <button
            onClick={() => router.push("/challenges")}
            className="mt-2 text-blue-600 hover:underline"
          >
            Back to Challenges
          </button>
        </div>
      ) : !challenge ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Challenge not found</p>
          <button
            onClick={() => router.push("/challenges")}
            className="mt-2 text-blue-600 hover:underline"
          >
            Back to Challenges
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{challenge.title}</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowVisualization(true)}
                className="btn-primary flex items-center"
                aria-label="Visualize Progress"
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
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                Visualize
              </button>
              <button
                onClick={() => router.push(`/challenges/${challenge.id}/edit`)}
                className="btn-secondary flex items-center"
                aria-label="Edit Challenge"
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
                className="btn-danger flex items-center"
                aria-label="Delete Challenge"
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

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Delete Challenge
                </h2>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this challenge? All progress
                  data will be lost. This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-danger flex items-center"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
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
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {challenge.description && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
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
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {challenge.description}
              </p>
            </div>
          )}

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
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              Challenge Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {challenge.type}
                  </span>
                </div>
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
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Duration
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(challenge.startDate)} -{" "}
                  {challenge.endDate
                    ? formatDate(challenge.endDate)
                    : "Ongoing"}
                </p>
              </div>
            </div>
          </div>

          {/* Conditionally render either the Goal view or the Challenge view */}
          {challenge.type === "GOAL" ? (
            <GoalView
              challenge={challenge}
              entries={entries}
              onEntryAdded={handleEntryAdded}
            />
          ) : (
            <>
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
                      Over {getTotalTimePeriodsInUnit()} {getTimeUnitLabel()}
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
                        (
                        {((getTotalProgress() / getTotalGoal()) * 100).toFixed(
                          2
                        )}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (getTotalProgress() / getTotalGoal()) * 100
                            )
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg transition-normal hover:shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 text-center md:text-left">
                      Expected Progress ({getTimePeriodLabel()}{" "}
                      {getCurrentTimePeriodInUnit()} of{" "}
                      {getTotalTimePeriodsInUnit()})
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 text-center md:text-left">
                      {getGoalSoFar().toLocaleString()} {challenge.unit}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 text-center md:text-left">
                      {((getGoalSoFar() / getTotalGoal()) * 100).toFixed(2)}% of
                      total goal
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
                        goalSoFar > 0
                          ? ((diff / goalSoFar) * 100).toFixed(2)
                          : "0.00";

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
            </>
          )}

          {/* Add Progress Section - conditional for Goals vs Challenges */}
          {challenge.type !== "GOAL" ||
          (challenge.type === "GOAL" &&
            challenge.metadata?.goalType === "fixed") ? (
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
          ) : null}

          {/* Progress History - only shown if there are entries or for fixed value goals */}
          {entries.length > 0 &&
            (challenge.type !== "GOAL" ||
              challenge.metadata?.goalType === "fixed") && (
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

                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="font-medium text-gray-900">
                              {formatDate(entry.date)}
                            </p>
                            {entry.value >= getCurrentTarget(entry.date) && (
                              <span className="badge badge-success">
                                Target Met
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Value: {entry.value} {challenge.unit}
                          </p>
                          {entry.notes && (
                            <div className="mt-3 p-3 bg-white rounded border border-gray-100">
                              <p className="text-sm text-gray-600">
                                {entry.notes}
                              </p>
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
                                    (entry.value /
                                      getCurrentTarget(entry.date)) *
                                      100
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
                            {entry.value}/{getCurrentTarget(entry.date)} of
                            {" " + getTargetUnitLabel()} target
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
              </div>
            )}

          {/* Edit Entry Modal - unchanged */}
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

          {/* Visualization Modal */}
          {showVisualization && challenge && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full animate-slide-up max-h-[90vh] overflow-y-auto">
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
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                      />
                    </svg>
                    Progress Visualization
                  </h2>
                  <button
                    onClick={() => setShowVisualization(false)}
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

                <div className="space-y-8">
                  {/* Progress Summary */}
                  {(() => {
                    const { actualProgress, expectedProgress, totalGoal } =
                      prepareVisualizationData();
                    const progressPercentage =
                      totalGoal > 0 ? (actualProgress / totalGoal) * 100 : 0;
                    const expectedPercentage =
                      totalGoal > 0 ? (expectedProgress / totalGoal) * 100 : 0;

                    return (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Progress Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Actual Progress
                            </p>
                            <p className="text-xl font-bold text-primary">
                              {actualProgress.toLocaleString()} {challenge.unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              {progressPercentage.toFixed(1)}% of total goal
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Expected Progress
                            </p>
                            <p className="text-xl font-bold text-gray-700">
                              {expectedProgress.toLocaleString()}{" "}
                              {challenge.unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              {expectedPercentage.toFixed(1)}% of total goal
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Total Goal
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                              {totalGoal.toLocaleString()} {challenge.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bar Chart - Progress Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Progress Comparison
                    </h3>
                    <div
                      className="bg-white border border-gray-200 rounded-lg p-4"
                      style={{ height: "300px" }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareVisualizationData().barChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `${value} ${challenge.unit}`,
                              "",
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="Total Goal"
                            fill="#374151"
                            barSize={60}
                          />
                          <Bar
                            dataKey="Expected Progress"
                            fill="#6B7280"
                            barSize={60}
                          />
                          <Bar
                            dataKey="Actual Progress"
                            fill="#3B82F6"
                            barSize={60}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Line Chart - Progress Over Time */}
                  {prepareVisualizationData().lineChartData.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Progress Over Time
                      </h3>
                      <div
                        className="bg-white border border-gray-200 rounded-lg p-4"
                        style={{ height: "300px" }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={prepareVisualizationData().lineChartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 20,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [
                                `${value} ${challenge.unit}`,
                                "Total Progress",
                              ]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#3B82F6"
                              activeDot={{ r: 8 }}
                              name="Total Progress"
                            />
                            <Line
                              type="monotone"
                              dataKey="expected"
                              stroke="#6B7280"
                              strokeDasharray="5 5"
                              activeDot={{ r: 6 }}
                              name="Expected Progress"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Pie Chart - Completion Percentage */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Completion Percentage
                    </h3>
                    <div
                      className="bg-white border border-gray-200 rounded-lg p-4 flex justify-center"
                      style={{ height: "300px" }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareVisualizationData().pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            <Cell fill="#3B82F6" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `${value} ${challenge.unit}`,
                              "",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowVisualization(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
