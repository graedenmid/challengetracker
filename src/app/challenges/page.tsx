"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getChallenges } from "@/lib/api";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target: number;
  unit: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading challenges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Challenges</h1>
        <Link
          href="/challenges/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          New Challenge
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">{challenge.title}</h2>
            <p className="text-gray-600 mb-4">{challenge.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {challenge.target} {challenge.unit} per{" "}
                {challenge.frequency.toLowerCase()}
              </span>
              <Link
                href={`/challenges/${challenge.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
