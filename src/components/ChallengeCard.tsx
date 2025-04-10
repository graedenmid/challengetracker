"use client";

import React from "react";
import Link from "next/link";
import { Challenge } from "@/types";

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  // Mock progress for now - will be replaced with actual progress calculation
  const progress = Math.floor(Math.random() * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {challenge.title}
          </h3>
          <p className="text-sm text-gray-500">
            Started {formatDate(challenge.startDate)}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs text-white ${getProgressColor(
            progress
          )}`}
        >
          {progress}%
        </span>
      </div>

      {challenge.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">
          {challenge.description}
        </p>
      )}

      <div className="flex flex-col space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            Target: {challenge.target} {challenge.unit}
          </span>
          <span>Frequency: {challenge.frequency.toLowerCase()}</span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor(
              progress
            )} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-end mt-4">
          <Link
            href={`/challenges/${challenge.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
