"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateChallenge, getChallenge } from "@/lib/api";
import { Challenge, ChallengeType, Frequency } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<
    Partial<Challenge> & { durationType: string; durationValue: number }
  >({
    title: "",
    description: "",
    type: "daily" as ChallengeType,
    target: 1,
    unit: "",
    frequency: "daily" as Frequency,
    startDate: "",
    endDate: "",
    isIncremental: false,
    baseValue: 1,
    incrementValue: 1,
    durationType: "endDate", // Default to endDate
    durationValue: 4, // Default duration
  });

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else if (type === "number") {
      // Allow empty string (when backspacing) but convert valid numbers
      const newValue = value === "" ? "" : parseInt(value) || 0;
      setFormData({
        ...formData,
        [name]: newValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Function to calculate the duration value from start and end dates
  const calculateDurationValue = (
    startDate: string,
    endDate: string,
    frequency: string
  ) => {
    if (!startDate || !endDate) return 4; // Default value

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the difference in days
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates

    if (frequency.toLowerCase() === "weekly") {
      return Math.ceil(diffDays / 7);
    } else if (frequency.toLowerCase() === "monthly") {
      // Approximate months by calculating the difference in months
      return (
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        (end.getDate() >= start.getDate() ? 1 : 0)
      );
    } else {
      // For daily frequency
      return diffDays;
    }
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const challenge = await getChallenge(params.id as string);
        const startDate = challenge.startDate
          ? challenge.startDate.split("T")[0]
          : "";
        const endDate = challenge.endDate
          ? challenge.endDate.split("T")[0]
          : "";

        // Calculate durationValue based on start and end dates if both exist
        const durationValue = endDate
          ? calculateDurationValue(startDate, endDate, challenge.frequency)
          : 4;

        setFormData({
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          target: challenge.target,
          unit: challenge.unit,
          frequency: challenge.frequency,
          startDate: startDate,
          endDate: endDate,
          isIncremental: challenge.isIncremental,
          baseValue: challenge.baseValue,
          incrementValue: challenge.incrementValue,
          durationType: endDate ? "endDate" : "duration",
          durationValue: durationValue,
        });
      } catch (err) {
        console.error("Error fetching challenge:", err);
        setError("Failed to load challenge");
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [params.id]);

  // Calculate end date when start date or duration settings change
  useEffect(() => {
    if (formData.durationType === "duration" && formData.startDate) {
      // Only calculate if we have a valid numeric duration value
      const durationValue = Number(formData.durationValue);
      if (isNaN(durationValue) || durationValue <= 0) return;

      const startDate = new Date(formData.startDate);
      let endDate = new Date(startDate);

      const frequency = formData.frequency?.toLowerCase() || "daily";

      if (frequency === "weekly") {
        // Add the specified number of weeks to the start date
        endDate.setDate(startDate.getDate() + durationValue * 7 - 1);
      } else if (frequency === "monthly") {
        // Add the specified number of months to the start date
        endDate.setMonth(startDate.getMonth() + durationValue - 1);
        // Keep same day of month if possible
        endDate.setDate(startDate.getDate());
      } else {
        // For daily frequency, add the specified number of days
        endDate.setDate(startDate.getDate() + durationValue - 1);
      }

      // Format the date as YYYY-MM-DD
      const formattedEndDate = endDate.toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        endDate: formattedEndDate,
      }));
    }
  }, [
    formData.startDate,
    formData.durationValue,
    formData.durationType,
    formData.frequency,
  ]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formInputData = new FormData(form);
    const startDate = formInputData.get("startDate") as string;
    const isIncremental = formInputData.get("isIncremental") === "on";
    const durationType = formInputData.get("durationType") as string;

    // Validate duration value if using duration option
    if (durationType === "duration") {
      const durationValue = Number(formData.durationValue);
      if (isNaN(durationValue) || durationValue <= 0) {
        setError(
          `Please enter a valid number of ${getDurationValueLabel().toLowerCase()}`
        );
        setSubmitting(false);
        return;
      }
    }

    // Get the end date based on the duration type
    // For duration-based challenges, use the calculated end date from component state
    // For end-date based challenges, use the value from the form
    const endDate =
      durationType === "duration"
        ? formData.endDate // Use the React component state's endDate
        : (formInputData.get("endDate") as string); // Use the form input value

    // Validate start date
    if (!startDate) {
      setError("Start date is required");
      setSubmitting(false);
      return;
    }

    // Validate dates if using explicit end date
    if (durationType === "endDate" && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (endDateObj < startDateObj) {
        setError("End date cannot be before start date");
        setSubmitting(false);
        return;
      }
    }

    try {
      await updateChallenge(params.id as string, {
        title: formInputData.get("title") as string,
        description: formInputData.get("description") as string,
        type: formInputData.get("type") as ChallengeType,
        target: parseInt(formInputData.get("target") as string),
        unit: formInputData.get("unit") as string,
        frequency: formInputData.get("frequency") as Frequency,
        startDate: startDate,
        endDate: endDate || null,
        isIncremental,
        baseValue: parseInt(formInputData.get("baseValue") as string) || 1,
        incrementValue:
          parseInt(formInputData.get("incrementValue") as string) || 1,
      });

      router.push(`/challenges/${params.id}`);
    } catch (err) {
      console.error("Error updating challenge:", err);
      setError("Failed to update challenge");
    } finally {
      setSubmitting(false);
    }
  };

  // Determine the label for duration value based on frequency
  const getDurationValueLabel = () => {
    const frequency = formData.frequency || "daily";
    switch (frequency.toLowerCase()) {
      case "weekly":
        return "Weeks";
      case "monthly":
        return "Months";
      default:
        return "Days";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Challenge</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="HABIT">Habit</option>
              <option value="GOAL">Goal</option>
              <option value="CHALLENGE">Challenge</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="target"
                className="block text-sm font-medium text-gray-700"
              >
                Target
              </label>
              <input
                type="number"
                id="target"
                name="target"
                value={formData.target}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700"
              >
                Unit
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="frequency"
              className="block text-sm font-medium text-gray-700"
            >
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Challenge Duration Options */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="block text-sm font-medium text-gray-700 mb-3">
              Challenge Duration
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="durationEndDate"
                  name="durationType"
                  value="endDate"
                  checked={formData.durationType === "endDate"}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label
                  htmlFor="durationEndDate"
                  className="ml-2 block text-sm text-gray-900"
                >
                  <span className="font-medium">End Date</span>
                  <span className="text-gray-500 block text-xs">
                    Specify the exact end date
                  </span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="durationPeriod"
                  name="durationType"
                  value="duration"
                  checked={formData.durationType === "duration"}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label
                  htmlFor="durationPeriod"
                  className="ml-2 block text-sm text-gray-900"
                >
                  <span className="font-medium">Duration</span>
                  <span className="text-gray-500 block text-xs">
                    Specify the number of{" "}
                    {getDurationValueLabel().toLowerCase()}
                  </span>
                </label>
              </div>

              {formData.durationType === "endDate" ? (
                <div className="pl-6 mt-2">
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="pl-6 mt-2">
                  <label
                    htmlFor="durationValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of {getDurationValueLabel()}
                  </label>
                  <input
                    type="number"
                    id="durationValue"
                    name="durationValue"
                    value={formData.durationValue}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required={formData.durationType === "duration"}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your challenge will end on{" "}
                    {formData.endDate
                      ? new Date(formData.endDate).toLocaleDateString()
                      : "the calculated end date"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isIncremental"
                name="isIncremental"
                checked={formData.isIncremental}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isIncremental"
                className="ml-2 block text-sm text-gray-900"
              >
                Enable incremental mode
              </label>
            </div>

            {formData.isIncremental && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="baseValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Base Value
                  </label>
                  <input
                    type="number"
                    id="baseValue"
                    name="baseValue"
                    value={formData.baseValue}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Starting value for the first day
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="incrementValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Increment Per{" "}
                    {(formData.frequency || "daily").charAt(0).toUpperCase() +
                      (formData.frequency || "daily").slice(1).toLowerCase()}
                  </label>
                  <input
                    type="number"
                    id="incrementValue"
                    name="incrementValue"
                    value={formData.incrementValue}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    How much to increase the target each{" "}
                    {(formData.frequency || "daily").toLowerCase()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.push(`/challenges/${params.id}`)}
              className="py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
