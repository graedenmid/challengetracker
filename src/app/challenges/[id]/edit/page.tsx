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
  const [formData, setFormData] = useState<Partial<Challenge>>({
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
    incrementPerDay: 1,
  });

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const challenge = await getChallenge(params.id as string);
        setFormData({
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          target: challenge.target,
          unit: challenge.unit,
          frequency: challenge.frequency,
          startDate: challenge.startDate
            ? challenge.startDate.split("T")[0]
            : "",
          endDate: challenge.endDate ? challenge.endDate.split("T")[0] : "",
          isIncremental: challenge.isIncremental,
          baseValue: challenge.baseValue,
          incrementPerDay: challenge.incrementPerDay,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const isIncremental = formData.get("isIncremental") === "on";

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = endDate ? new Date(endDate) : null;

    if (endDateObj && endDateObj < startDateObj) {
      setError("End date cannot be before start date");
      setSubmitting(false);
      return;
    }

    try {
      await updateChallenge(params.id as string, {
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
      });

      router.push(`/challenges/${params.id}`);
    } catch (err) {
      console.error("Error updating challenge:", err);
      setError("Failed to update challenge");
    } finally {
      setSubmitting(false);
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
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ChallengeType,
                })
              }
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
                onChange={(e) =>
                  setFormData({ ...formData, target: parseInt(e.target.value) })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency: e.target.value as Frequency,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
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
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
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
                value={formData.endDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseValue: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    How much to increase the target each day
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
