"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createChallenge } from "@/lib/api";
import { ChallengeType, Frequency } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function NewChallengePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "daily" as ChallengeType,
    target: 1,
    unit: "",
    frequency: "daily" as Frequency,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isIncremental: false,
    baseValue: 1,
    incrementValue: 1,
    durationType: "endDate",
    durationValue: 4,
  });

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

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isIncremental: e.target.value === "incremental",
    });
  };

  const handleDurationTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      durationType: e.target.value,
    });
  };

  useEffect(() => {
    if (formData.durationType === "duration" && formData.startDate) {
      const durationValue = Number(formData.durationValue);
      if (isNaN(durationValue) || durationValue <= 0) return;

      const startDate = new Date(formData.startDate);
      let endDate = new Date(startDate);

      const frequency = formData.frequency.toLowerCase();

      if (frequency === "weekly") {
        endDate.setDate(startDate.getDate() + durationValue * 7 - 1);
      } else if (frequency === "monthly") {
        endDate.setMonth(startDate.getMonth() + durationValue - 1);
        endDate.setDate(startDate.getDate());
      } else {
        endDate.setDate(startDate.getDate() + durationValue - 1);
      }

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
    const form = e.currentTarget;
    const formInputData = new FormData(form);
    const startDate = formInputData.get("startDate") as string;
    const isIncremental = formInputData.get("challengeType") === "incremental";
    const unit = formInputData.get("unit") as string;
    const durationType = formInputData.get("durationType") as string;

    if (!unit) {
      alert("Please enter a unit for your challenge");
      return;
    }

    if (!startDate) {
      alert("Please enter a start date");
      return;
    }

    // Validate duration value if using duration option
    if (durationType === "duration") {
      const durationValue = Number(formData.durationValue);
      if (isNaN(durationValue) || durationValue <= 0) {
        alert(
          `Please enter a valid number of ${getDurationValueLabel().toLowerCase()}`
        );
        return;
      }
    }

    const endDate =
      durationType === "duration"
        ? formData.endDate // Use the React component state's endDate
        : (formInputData.get("endDate") as string); // Use the form input value

    if (durationType === "endDate" && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (endDateObj < startDateObj) {
        alert("End date cannot be before start date");
        return;
      }
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      let target, baseValue, incrementValue;

      if (isIncremental) {
        baseValue = parseInt(formInputData.get("baseValue") as string) || 1;
        incrementValue =
          parseInt(formInputData.get("incrementValue") as string) || 1;
        target = baseValue;
      } else {
        target = parseInt(formInputData.get("target") as string) || 1;
        baseValue = target;
        incrementValue = 0;
      }

      console.log("Creating challenge with:", {
        isIncremental,
        target,
        baseValue,
        incrementValue,
        endDate,
      });

      await createChallenge({
        title: formInputData.get("title") as string,
        description: formInputData.get("description") as string,
        type: formInputData.get("type") as ChallengeType,
        target,
        unit,
        frequency: formInputData.get("frequency") as Frequency,
        startDate: startDate,
        endDate: endDate || null,
        isIncremental,
        baseValue,
        incrementValue,
        userId: session.user.id,
      });

      router.push("/challenges");
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Failed to create challenge. Please try again.");
    }
  };

  const getDurationValueLabel = () => {
    switch (formData.frequency.toLowerCase()) {
      case "weekly":
        return "Weeks";
      case "monthly":
        return "Months";
      default:
        return "Days";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Challenge</h1>
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
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="block text-sm font-medium text-gray-700 mb-3">
              Challenge Type
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="staticChallenge"
                  name="challengeType"
                  value="static"
                  checked={!formData.isIncremental}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label
                  htmlFor="staticChallenge"
                  className="ml-2 block text-sm text-gray-900"
                >
                  <span className="font-medium">Static Challenge</span>
                  <span className="text-gray-500 block text-xs">
                    Same target every day
                  </span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="incrementalChallenge"
                  name="challengeType"
                  value="incremental"
                  checked={formData.isIncremental}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label
                  htmlFor="incrementalChallenge"
                  className="ml-2 block text-sm text-gray-900"
                >
                  <span className="font-medium">Incremental Challenge</span>
                  <span className="text-gray-500 block text-xs">
                    Target increases over time
                  </span>
                </label>
              </div>
            </div>
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

          {formData.isIncremental ? (
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="font-medium text-blue-800">
                Incremental Challenge Settings
              </p>

              <div>
                <label
                  htmlFor="baseValue"
                  className="block text-sm font-medium text-gray-700"
                >
                  Starting Target
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="number"
                    id="baseValue"
                    name="baseValue"
                    value={formData.baseValue}
                    onChange={handleChange}
                    min="1"
                    className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="unit"
                    className="rounded-r-md border-l-0 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 w-24"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Target for the first {formData.frequency.toLowerCase()} of
                  your challenge
                </p>
              </div>

              <div>
                <label
                  htmlFor="incrementValue"
                  className="block text-sm font-medium text-gray-700"
                >
                  Increment Per{" "}
                  {formData.frequency.charAt(0) +
                    formData.frequency.slice(1).toLowerCase()}
                </label>
                <input
                  type="number"
                  id="incrementValue"
                  name="incrementValue"
                  value={formData.incrementValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      incrementValue: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  How much to increase the target each{" "}
                  {formData.frequency.toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="font-medium text-green-800 mb-3">
                Static Challenge Settings
              </p>

              <div>
                <label
                  htmlFor="target"
                  className="block text-sm font-medium text-gray-700"
                >
                  Target
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="number"
                    id="target"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    min="1"
                    className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="unit"
                    className="rounded-r-md border-l-0 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 w-24"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  The same target to achieve every{" "}
                  {formData.frequency.toLowerCase()}
                </p>
              </div>
            </div>
          )}

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
                  onChange={handleDurationTypeChange}
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
                  onChange={handleDurationTypeChange}
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
                    value={formData.endDate}
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

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
