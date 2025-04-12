"use client";

import { useEffect, useState } from "react";
import { getChallenges } from "@/lib/api";
import { Challenge } from "@/types";
import Link from "next/link";
import ChallengeCard from "@/components/ChallengeCard";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await getChallenges();
        setChallenges(data);
      } catch (err) {
        setError("Failed to load challenges");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const filteredChallenges = () => {
    if (activeFilter === "all") return challenges;
    return challenges.filter((challenge) => challenge.type === activeFilter);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p>{error}</p>
          <p className="mt-2">
            Please try refreshing the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            My Challenges
          </h1>
          <p className="text-gray-600">
            Track and manage your personal challenges
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/challenges/new" className="btn-primary">
            <span className="mr-2">+</span> New Challenge
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex overflow-x-auto py-2 gap-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeFilter === "all"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            All Challenges
          </button>
          <button
            onClick={() => setActiveFilter("daily")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeFilter === "daily"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveFilter("weekly")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeFilter === "weekly"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveFilter("monthly")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeFilter === "monthly"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveFilter("custom")}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeFilter === "custom"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No challenges yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first challenge to start tracking your goals
          </p>
          <Link href="/challenges/new" className="btn-primary">
            Create a Challenge
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges().map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
}
