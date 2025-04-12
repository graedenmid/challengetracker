"use client";

import Link from "next/link";
import { Challenge } from "@/types";

interface ChallengeCardProps {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!challenge.endDate) return "Ongoing";

    const endDate = new Date(challenge.endDate);
    const today = new Date();

    // Set to UTC dates to avoid timezone issues
    const endUTC = Date.UTC(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    const todayUTC = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const diffTime = endUTC - todayUTC;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Completed";
    if (diffDays === 0) return "Last day";
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
  };

  // Determine card variant based on challenge type
  const getCardColor = () => {
    switch (challenge.type) {
      case "daily":
        return "border-l-4 border-l-primary";
      case "weekly":
        return "border-l-4 border-l-secondary";
      case "monthly":
        return "border-l-4 border-l-accent";
      default:
        return "border-l-4 border-l-primary-light";
    }
  };

  // Format date for display (YYYY-MM-DD to Month DD, YYYY)
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div className={`card hover:shadow-hover transition-all ${getCardColor()}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-1 text-gray-800">
            {challenge.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {challenge.frequency.charAt(0).toUpperCase() +
              challenge.frequency.slice(1)}
          </p>
        </div>
        <div className="badge badge-info">{challenge.type}</div>
      </div>

      {challenge.description && (
        <p className="text-gray-700 mb-4 line-clamp-2">
          {challenge.description}
        </p>
      )}

      <div className="flex justify-between items-center text-sm mb-3">
        <span className="text-gray-600">
          Target: {challenge.target} {challenge.unit}/{challenge.frequency}
        </span>
        <span className="text-gray-600">
          Started: {formatDate(challenge.startDate)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span
          className={`text-sm font-medium ${
            calculateDaysRemaining() === "Completed"
              ? "text-gray-500"
              : calculateDaysRemaining() === "Last day"
              ? "text-accent-dark"
              : "text-primary"
          }`}
        >
          {calculateDaysRemaining()}
        </span>
        <Link
          href={`/challenges/${challenge.id}`}
          className="btn-primary py-1 px-3 text-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
