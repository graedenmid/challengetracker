"use client";

import React, { useState, useEffect } from "react";
import { Challenge } from "@/types";

interface EntryFormProps {
  challengeId: string;
  onEntryAdded: () => void;
  challenge: Challenge;
}

export function EntryForm({
  challengeId,
  onEntryAdded,
  challenge,
}: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get today's date in local timezone, formatted as YYYY-MM-DD
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [quickComplete, setQuickComplete] = useState(false);

  const getCurrentTarget = (date: string) => {
    // If the selected date is before the challenge start date, return 0
    try {
      const selectedDate = new Date(date);
      const startDate = new Date(challenge.startDate);

      // Set times to noon to avoid timezone issues
      selectedDate.setHours(12, 0, 0, 0);
      startDate.setHours(12, 0, 0, 0);

      if (selectedDate < startDate) {
        console.log("Selected date is before challenge start date. Target: 0");
        return 0;
      }

      if (!challenge.isIncremental) {
        return challenge.target;
      }

      const diffTime = Math.abs(selectedDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return challenge.baseValue + diffDays * challenge.incrementPerDay;
    } catch (error) {
      console.error("Error calculating target:", error);
      return challenge.isIncremental ? challenge.baseValue : challenge.target;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const date = formData.get("date") as string;

    // If quickComplete is true, use the target value, otherwise use the input value
    let value: number;
    if (quickComplete) {
      value = getCurrentTarget(date);
    } else {
      const valueInput = formData.get("value");
      if (!valueInput || isNaN(parseInt(valueInput as string))) {
        setError("Please enter a valid value");
        setLoading(false);
        return;
      }
      value = parseInt(valueInput as string);
    }

    const notes = formData.get("notes") as string;

    // Validate date is within challenge range
    const entryDate = new Date(date);
    const startDate = new Date(challenge.startDate);
    const endDate = challenge.endDate ? new Date(challenge.endDate) : null;

    if (entryDate < startDate || (endDate && entryDate > endDate)) {
      setError("Date must be within the challenge period");
      setLoading(false);
      return;
    }

    // Format the date properly for storage in PostgreSQL
    const formattedDate = date + "T00:00:00.000Z";

    try {
      console.log("Submitting entry:", {
        date: formattedDate,
        value,
        notes,
      });

      const response = await fetch(`/api/challenges/${challengeId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          date: formattedDate,
          value: Number(value),
          notes: notes || "",
        }),
        credentials: "include",
      });

      // Get response data
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        console.error("Error response:", responseData);
        throw new Error(responseData.error || "Failed to add entry");
      }

      console.log("Entry added successfully:", responseData);

      // Clear form values by setting input values directly rather than using reset
      try {
        const valueInput = form.querySelector(
          'input[name="value"]'
        ) as HTMLInputElement;
        const notesInput = form.querySelector(
          'textarea[name="notes"]'
        ) as HTMLTextAreaElement;

        if (valueInput) valueInput.value = "";
        if (notesInput) notesInput.value = "";
      } catch (resetError) {
        console.error("Error resetting form:", resetError);
      }

      // Reset date to today
      const today = new Date();
      const formattedToday = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setSelectedDate(formattedToday);
      setQuickComplete(false);
      setError(null);

      // Refresh entries list
      onEntryAdded();
    } catch (err) {
      console.error("Error adding entry:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add entry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate the date and target
      const date = selectedDate;
      const todayTarget = getCurrentTarget(date);
      const formattedDate = date + "T00:00:00.000Z";

      // Submit the entry directly without using the form
      const response = await fetch(`/api/challenges/${challengeId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          date: formattedDate,
          value: Number(todayTarget),
          notes: "Completed via quick complete",
        }),
        credentials: "include",
      });

      // Get response data
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        console.error("Error response:", responseData);
        throw new Error(responseData.error || "Failed to add entry");
      }

      console.log("Quick complete entry added successfully:", responseData);

      // Reset form and clear any errors
      // Reset date to today using the same format as our initialization
      const today = new Date();
      const formattedToday = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setSelectedDate(formattedToday);
      setQuickComplete(false);
      setError(null);

      // Call onEntryAdded immediately - no need for timeout
      onEntryAdded();
    } catch (err) {
      console.error("Error with quick complete:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add entry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Today's Target</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {getCurrentTarget(selectedDate)} {challenge.unit}
          </p>
        </div>
        <button
          type="button"
          onClick={handleQuickComplete}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Complete Today
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={challenge.startDate}
              max={challenge.endDate || undefined}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700"
            >
              Value
            </label>
            <input
              type="number"
              id="value"
              name="value"
              required={!quickComplete}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Target: {getCurrentTarget(selectedDate)} {challenge.unit}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Adding..." : "Add Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
