import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 max-w-6xl">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Track Your <span className="text-primary">Challenges</span> with
            Ease
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Set goals, track progress, and celebrate achievements on your
            journey to building better habits.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/challenges"
              className="btn-primary px-6 py-3 text-base"
            >
              View My Challenges
            </Link>
            <Link
              href="/challenges/new"
              className="btn-secondary px-6 py-3 text-base"
            >
              Create New Challenge
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="card transition-all hover:shadow-hover">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create a Challenge</h3>
            <p className="text-gray-600">
              Set up your personal challenge with custom goals, duration, and
              targets.
            </p>
          </div>

          <div className="card transition-all hover:shadow-hover">
            <div className="rounded-full bg-secondary/10 w-12 h-12 flex-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-secondary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Your Progress</h3>
            <p className="text-gray-600">
              Update your daily activities and see how you're measuring up to
              your goals.
            </p>
          </div>

          <div className="card transition-all hover:shadow-hover">
            <div className="rounded-full bg-accent/10 w-12 h-12 flex-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-accent"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyze Results</h3>
            <p className="text-gray-600">
              Visualize your achievements and identify patterns to improve your
              habits.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 my-8 bg-gradient-to-r from-primary-light to-primary rounded-xl text-white">
        <div className="text-center px-4 py-10">
          <h2 className="text-3xl font-bold mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Create your first challenge today and start building better habits.
          </p>
          <Link
            href="/challenges/new"
            className="bg-white text-primary font-medium px-8 py-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
