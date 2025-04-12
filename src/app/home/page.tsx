import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1rem" }}
      className="container mx-auto px-4 max-w-4xl"
    >
      {/* Hero Section */}
      <section
        className="py-10 md:py-16"
        style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}
      >
        <div style={{ textAlign: "center" }} className="text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1F2937",
              marginBottom: "1rem",
            }}
          >
            Track Your{" "}
            <span style={{ color: "#3B82F6" }} className="text-primary">
              Challenges
            </span>{" "}
            with Ease
          </h1>
          <p
            className="text-lg text-gray-600 max-w-xl mx-auto mb-8"
            style={{
              fontSize: "1.125rem",
              color: "#4B5563",
              maxWidth: "36rem",
              margin: "0 auto 2rem",
            }}
          >
            Set goals, track progress, and celebrate achievements on your
            journey to building better habits.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              justifyContent: "center",
              margin: "0 auto",
              maxWidth: "24rem",
            }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/challenges"
              style={{
                backgroundColor: "#3B82F6",
                color: "white",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                display: "inline-block",
              }}
              className="btn-primary px-5 py-2 text-sm md:text-base"
            >
              View My Challenges
            </Link>
            <Link
              href="/challenges/new"
              style={{
                backgroundColor: "white",
                color: "#3B82F6",
                border: "1px solid #3B82F6",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                display: "inline-block",
              }}
              className="btn-secondary px-5 py-2 text-sm md:text-base"
            >
              Create New Challenge
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-8 md:py-12"
        style={{ paddingTop: "2rem", paddingBottom: "3rem" }}
      >
        <h2
          className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-8"
          style={{
            fontSize: "1.75rem",
            fontWeight: "600",
            textAlign: "center",
            color: "#1F2937",
            marginBottom: "2rem",
          }}
        >
          How It Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
            gap: "1.5rem",
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
            className="card transition-all hover:shadow-hover flex flex-col items-center text-center"
          >
            <div
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: "50%",
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
              className="rounded-full bg-primary/10 w-8 h-8 flex-center mb-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ width: "1rem", height: "1rem", color: "#3B82F6" }}
                className="w-4 h-4 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Create a Challenge
            </h3>
            <p
              className="text-gray-600 text-sm"
              style={{ fontSize: "0.875rem", color: "#4B5563" }}
            >
              Set up your personal challenge with custom goals, duration, and
              targets.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
            className="card transition-all hover:shadow-hover flex flex-col items-center text-center"
          >
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderRadius: "50%",
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
              className="rounded-full bg-secondary/10 w-8 h-8 flex-center mb-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ width: "1rem", height: "1rem", color: "#10B981" }}
                className="w-4 h-4 text-secondary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Track Your Progress
            </h3>
            <p
              className="text-gray-600 text-sm"
              style={{ fontSize: "0.875rem", color: "#4B5563" }}
            >
              Update your daily activities and see how you're measuring up to
              your goals.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
            className="card transition-all hover:shadow-hover flex flex-col items-center text-center"
          >
            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderRadius: "50%",
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
              className="rounded-full bg-accent/10 w-8 h-8 flex-center mb-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ width: "1rem", height: "1rem", color: "#F59E0B" }}
                className="w-4 h-4 text-accent"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Analyze Results
            </h3>
            <p
              className="text-gray-600 text-sm"
              style={{ fontSize: "0.875rem", color: "#4B5563" }}
            >
              Visualize your achievements and identify patterns to improve your
              habits.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        style={{
          background: "linear-gradient(to right, #60A5FA, #3B82F6)",
          borderRadius: "0.5rem",
          padding: "2rem 1rem",
          margin: "1.5rem 0",
        }}
        className="py-8 my-6 bg-gradient-to-r from-primary-light to-primary rounded-lg text-white"
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "28rem",
            margin: "0 auto",
            padding: "0 1rem",
          }}
          className="text-center px-4 py-6 max-w-md mx-auto"
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "1rem",
              color: "white",
            }}
            className="text-2xl font-bold mb-4"
          >
            Ready to start your journey?
          </h2>
          <p
            style={{
              fontSize: "1rem",
              marginBottom: "1.5rem",
              color: "rgba(255, 255, 255, 0.9)",
            }}
            className="text-base mb-6 mx-auto opacity-90"
          >
            Create your first challenge today and start building better habits.
          </p>
          <Link
            href="/challenges/new"
            style={{
              backgroundColor: "white",
              color: "#3B82F6",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem",
              fontWeight: "500",
              fontSize: "0.875rem",
              display: "inline-block",
            }}
            className="bg-white text-primary font-medium px-6 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
