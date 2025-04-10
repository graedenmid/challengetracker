import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          Challenge Tracker
        </h1>
        <p className="text-center text-gray-600">
          Track your personal challenges and goals
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <Link
          href="/challenges"
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">My Challenges</h2>
          <p className="text-gray-600">
            View and manage your active challenges
          </p>
        </Link>

        <Link
          href="/challenges/new"
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">New Challenge</h2>
          <p className="text-gray-600">Create a new challenge or goal</p>
        </Link>
      </div>
    </div>
  );
}
