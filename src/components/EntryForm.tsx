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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<
    { date: string; isSelectable: boolean; isSelected: boolean }[]
  >([]);

  // Initialize calendar dates when modal opens
  useEffect(() => {
    if (showBulkModal) {
      generateCalendarDates();
    }
  }, [showBulkModal]);

  // Generate dates for the calendar
  const generateCalendarDates = () => {
    const dates: {
      date: string;
      isSelectable: boolean;
      isSelected: boolean;
    }[] = [];

    // Start date of the challenge - parse date components to avoid timezone issues
    const startDateStr = challenge.startDate.split("T")[0];
    const [startYear, startMonth, startDay] = startDateStr
      .split("-")
      .map(Number);
    // Create date with date components only (with noon time to avoid any timezone edge cases)
    const start = new Date(startYear, startMonth - 1, startDay, 12, 0, 0, 0);

    // End date is either the challenge end date or today, whichever is earlier
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let end;
    if (challenge.endDate) {
      const endDateStr = challenge.endDate.split("T")[0];
      const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);
      const endDate = new Date(endYear, endMonth - 1, endDay, 12, 0, 0, 0);
      end = new Date(Math.min(endDate.getTime(), today.getTime()));
    } else {
      end = today;
    }

    console.log(
      `Generating calendar dates from ${start.toISOString()} to ${end.toISOString()}`
    );

    // If start date is in the future, no dates are selectable
    if (start > today) {
      console.log("Start date is in the future, no dates are selectable");
      setCalendarDates([]);
      return;
    }

    // Generate dates from start to end (not before start date)
    // Ensure we start exactly at the challenge start date, not before
    let current = new Date(start);
    let count = 0;
    while (current <= end) {
      const dateStr = formatDateForInput(current);
      dates.push({
        date: dateStr,
        isSelectable: true,
        isSelected: selectedDates.includes(dateStr),
      });

      // Debug logging for the first and last few dates
      if (
        count < 3 ||
        end.getTime() - current.getTime() < 3 * 24 * 60 * 60 * 1000
      ) {
        console.log(
          `Calendar date ${count + 1}: ${dateStr}, target: ${getCurrentTarget(
            dateStr
          )}`
        );
      } else if (count === 3) {
        console.log("... more dates ...");
      }

      current.setDate(current.getDate() + 1);
      count++;
    }

    // Sort dates in ascending order to ensure they appear chronologically
    dates.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`Generated ${dates.length} calendar dates`);
    setCalendarDates(dates);
  };

  // Format a date as YYYY-MM-DD
  const formatDateForInput = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Format a date for display
  const formatDateForDisplay = (dateStr: string): string => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateStr.split("-").map(Number);
    // Create date with consistent timezone handling (noon to avoid any date shifting)
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getCurrentTarget = (date: string) => {
    if (!challenge || !date) {
      console.error("getCurrentTarget: Challenge or date is null");
      return 0;
    }

    try {
      // Parse the dates making sure to handle them consistently in UTC
      const [yearStr, monthStr, dayStr] = date.split("-").map(Number);
      const [startYearStr, startMonthStr, startDayStr] = challenge.startDate
        .split("T")[0]
        .split("-")
        .map(Number);

      // Create Date objects for consistent comparison (noon UTC to avoid timezone issues)
      const dateToCheck = new Date(
        Date.UTC(yearStr, monthStr - 1, dayStr, 12, 0, 0)
      );
      const startDate = new Date(
        Date.UTC(startYearStr, startMonthStr - 1, startDayStr, 12, 0, 0)
      );

      console.log(
        `Checking target for date: ${dateToCheck.toISOString()} vs start: ${startDate.toISOString()}`
      );

      // If selected date is before challenge start date
      if (dateToCheck < startDate) {
        console.log("Selected date is before challenge start");
        return 0;
      }

      // Base value is the initial target; default to 1 if not set
      const baseValue =
        typeof challenge.baseValue === "number"
          ? challenge.baseValue
          : Number(challenge.baseValue || 1);

      // For non-incremental challenges, just return the constant target
      if (!challenge.isIncremental) {
        return challenge.target;
      }

      // Increment value for incremental challenges
      const incrementValue =
        typeof challenge.incrementValue === "number"
          ? challenge.incrementValue
          : Number(challenge.incrementValue || 1);

      const frequency = challenge.frequency?.toLowerCase() || "daily";

      if (frequency === "daily") {
        // Calculate the number of days since start date
        const diffTime = dateToCheck.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Start date gets baseValue, subsequent days get incremented
        const target = baseValue + diffDays * incrementValue;

        console.log(
          `Daily increment: Day ${diffDays} = ${baseValue} + (${diffDays} * ${incrementValue}) = ${target}`
        );
        return target;
      } else if (frequency === "weekly") {
        // Calculate the number of weeks since start date
        const diffTime = dateToCheck.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);

        // Start week gets baseValue, subsequent weeks get incremented
        const target = baseValue + diffWeeks * incrementValue;

        console.log(
          `Weekly increment: Week ${diffWeeks} = ${baseValue} + (${diffWeeks} * ${incrementValue}) = ${target}`
        );
        return target;
      } else if (frequency === "monthly") {
        // Calculate month difference accurately
        let diffMonths =
          (dateToCheck.getFullYear() - startDate.getFullYear()) * 12 +
          (dateToCheck.getMonth() - startDate.getMonth());

        // Adjust for day of month (if date is earlier in the month than start date)
        if (dateToCheck.getDate() < startDate.getDate()) {
          diffMonths -= 1;
        }

        // Ensure we don't go negative for dates just after start date
        const adjustedDiffMonths = Math.max(0, diffMonths);
        const target = baseValue + adjustedDiffMonths * incrementValue;

        console.log(
          `Monthly increment: Month ${adjustedDiffMonths} = ${baseValue} + (${adjustedDiffMonths} * ${incrementValue}) = ${target}`
        );
        return target;
      }

      // Fallback to daily if frequency is unknown
      console.error(`Unknown frequency: ${frequency}, defaulting to daily`);
      const diffTime = dateToCheck.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return baseValue + diffDays * incrementValue;
    } catch (error) {
      console.error("Error in getCurrentTarget:", error);
      return 0;
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

  // Handle toggling a date in the calendar
  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });

    // Update the calendar dates
    setCalendarDates((prev) =>
      prev.map((item) =>
        item.date === dateStr ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  // Handle bulk submission
  const handleBulkSubmit = async () => {
    if (selectedDates.length === 0) {
      setBulkError("Please select at least one date");
      return;
    }

    setBulkLoading(true);
    setBulkError(null);

    try {
      // Process dates in sequence to avoid overwhelming the server
      for (const dateStr of selectedDates) {
        const target = getCurrentTarget(dateStr);
        const formattedDate = dateStr + "T00:00:00.000Z";

        const response = await fetch(`/api/challenges/${challengeId}/entries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            date: formattedDate,
            value: target,
            notes: "Added via bulk completion",
          }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to add entry for ${dateStr}`
          );
        }
      }

      console.log(`Successfully added ${selectedDates.length} entries`);

      // Clear selections and close modal
      setSelectedDates([]);
      setShowBulkModal(false);

      // Refresh entries list
      onEntryAdded();
    } catch (err) {
      console.error("Error adding bulk entries:", err);
      setBulkError(
        err instanceof Error
          ? err.message
          : "Failed to add entries. Please try again."
      );
    } finally {
      setBulkLoading(false);
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Add Past Completions
          </button>
          <button
            type="button"
            onClick={handleQuickComplete}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Complete Today
          </button>
        </div>
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

      {/* Bulk Add Modal */}
      {showBulkModal && (
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
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                Add Past Completions
              </h2>
              <button
                onClick={() => setShowBulkModal(false)}
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

            <p className="text-gray-600 mb-4">
              Select the dates you've completed this challenge. Each date will
              be marked as completed with that day's target.
            </p>

            {calendarDates.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">
                  No past dates available for selection.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-xs text-gray-500 flex justify-between px-2">
                  <span>
                    Available dates:{" "}
                    {formatDateForDisplay(challenge.startDate.split("T")[0])} -{" "}
                    {formatDateForDisplay(
                      calendarDates[calendarDates.length - 1].date
                    )}
                  </span>
                  <span>Total: {calendarDates.length} days</span>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 mb-4">
                  {calendarDates.map((item) => (
                    <button
                      key={item.date}
                      onClick={() => toggleDateSelection(item.date)}
                      disabled={!item.isSelectable}
                      className={`p-2 rounded text-sm ${
                        item.isSelected
                          ? "bg-indigo-100 border-2 border-indigo-500"
                          : "bg-white border border-gray-200 hover:border-indigo-300"
                      } ${
                        !item.isSelectable
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="text-xs text-gray-500">
                        {formatDateForDisplay(item.date)}
                      </div>
                      <div className="mt-1 font-medium text-gray-800">
                        {getCurrentTarget(item.date)} {challenge.unit}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected dates:</span>
                <span className="text-sm font-medium">
                  {selectedDates.length}
                </span>
              </div>
            </div>

            {bulkError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{bulkError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={bulkLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkLoading || selectedDates.length === 0}
                className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center ${
                  bulkLoading || selectedDates.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {bulkLoading ? (
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
                    Processing...
                  </>
                ) : (
                  <>Add Entries</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
