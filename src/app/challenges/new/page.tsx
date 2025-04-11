"use client";

import React, { useState } from "react";
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
    incrementPerDay: 1,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const isIncremental = formData.get("isIncremental") === "on";

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = endDate ? new Date(endDate) : null;

    if (endDateObj && endDateObj < startDateObj) {
      alert("End date cannot be before start date");
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      await createChallenge({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as ChallengeType,
        target: parseInt(formData.get("target") as string),
        unit: formData.get("unit") as string,
        frequency: formData.get("frequency") as Frequency,
        startDate: startDate,
        endDate: endDate || null,
        isIncremental,
        baseValue: parseInt(formData.get("baseValue") as string) || 1,
        incrementPerDay:
          parseInt(formData.get("incrementPerDay") as string) || 1,
        userId: session.user.id,
      });

      router.push("/challenges");
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Failed to create challenge. Please try again.");
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              defaultValue="HABIT"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              defaultValue="DAILY"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date (Optional)
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isIncremental"
                name="isIncremental"
                checked={formData.isIncremental}
                onChange={(e) =>
                  setFormData({ ...formData, isIncremental: e.target.checked })
                }
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
              <>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseValue: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Starting value for the first day
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="incrementPerDay"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Increment Per Day
                  </label>
                  <input
                    type="number"
                    id="incrementPerDay"
                    name="incrementPerDay"
                    value={formData.incrementPerDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        incrementPerDay: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    How much to increase the target each day
                  </p>
                </div>
              </>
            )}
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
