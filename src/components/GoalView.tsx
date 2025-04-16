import React, { useState } from "react";
import { Challenge, ChallengeEntry } from "@/types";
import { formatDate } from "@/lib/utils";

interface GoalViewProps {
  challenge: Challenge;
  entries: ChallengeEntry[];
  onEntryAdded: () => void;
}

interface GoalTask {
  description: string;
  dueDate: string;
  completed: boolean;
}

export default function GoalView({
  challenge,
  entries,
  onEntryAdded,
}: GoalViewProps) {
  const isFixedGoal = challenge.metadata?.goalType === "fixed";
  const isSplitGoal = challenge.metadata?.splitGoal === true;
  const isTaskBasedGoal = challenge.metadata?.goalType === "task-based";

  return (
    <div className="mb-8">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This is a {isFixedGoal ? "fixed value" : "task-based"} goal.
            </p>
          </div>
        </div>
      </div>

      {isFixedGoal && (
        <FixedValueGoalView
          challenge={challenge}
          entries={entries}
          isSplitGoal={isSplitGoal}
          onEntryAdded={onEntryAdded}
        />
      )}

      {isTaskBasedGoal && (
        <TaskBasedGoalView
          challenge={challenge}
          entries={entries}
          onEntryAdded={onEntryAdded}
        />
      )}
    </div>
  );
}

interface FixedValueGoalViewProps {
  challenge: Challenge;
  entries: ChallengeEntry[];
  isSplitGoal: boolean;
  onEntryAdded: () => void;
}

function FixedValueGoalView({
  challenge,
  entries,
  isSplitGoal,
  onEntryAdded,
}: FixedValueGoalViewProps) {
  const totalProgress = entries.reduce((sum, entry) => sum + entry.value, 0);
  const progressPercentage = Math.min(
    100,
    (totalProgress / challenge.target) * 100
  );

  // Calculate days/weeks/months between today and end date
  const startDate = new Date(challenge.startDate);
  const endDate = challenge.endDate ? new Date(challenge.endDate) : new Date();
  const today = new Date();

  // Calculate remaining time
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const elapsedDays = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.max(0, totalDays - elapsedDays);

  // Calculate daily/weekly/monthly target if the goal is split
  let intervalTarget = challenge.target;
  let intervalUnit = "";

  if (isSplitGoal) {
    const frequency = challenge.frequency;
    const totalIntervals = calculateTotalIntervals(
      startDate,
      endDate,
      frequency
    );
    intervalTarget = Math.ceil(challenge.target / totalIntervals);

    switch (frequency) {
      case "DAILY":
        intervalUnit = "day";
        break;
      case "WEEKLY":
        intervalUnit = "week";
        break;
      case "MONTHLY":
        intervalUnit = "month";
        break;
      default:
        intervalUnit = "interval";
    }
  }

  // Calculate expected progress to date
  const timeElapsedPercentage = Math.min(100, (elapsedDays / totalDays) * 100);
  const expectedProgress = Math.ceil(
    (challenge.target * timeElapsedPercentage) / 100
  );

  // Check if ahead or behind
  const difference = totalProgress - expectedProgress;
  const isAhead = difference >= 0;

  return (
    <div>
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-sm mr-2 text-yellow-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
            />
          </svg>
          Goal Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 p-5 rounded-lg flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Target</h3>
            <p className="text-2xl font-bold text-gray-900">
              {challenge.target.toLocaleString()} {challenge.unit}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              by{" "}
              {challenge.endDate
                ? formatDate(challenge.endDate)
                : "No end date"}
            </p>
          </div>

          <div className="bg-yellow-50 p-5 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Current Progress
            </h3>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-gray-900">
                {totalProgress.toLocaleString()} {challenge.unit}
              </p>
              <span className="text-sm font-normal text-gray-500 ml-2 mb-1">
                ({progressPercentage.toFixed(2)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div
                className="bg-yellow-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {isSplitGoal && (
            <div className="bg-yellow-50 p-5 rounded-lg col-span-1 md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Split Goal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Target per {intervalUnit}
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {intervalTarget.toLocaleString()} {challenge.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Frequency</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {challenge.frequency.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress Tracking</p>
                  <p className="text-xl font-semibold text-gray-900">
                    By {intervalUnit}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-5 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline</h3>
            <p className="text-lg font-semibold text-gray-900">
              {remainingDays} days remaining
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div
                className="bg-gray-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${timeElapsedPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {timeElapsedPercentage.toFixed(2)}% of time elapsed
            </p>
          </div>

          <div className="bg-yellow-50 p-5 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            {isAhead ? (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    Ahead of schedule
                  </p>
                  <p className="text-sm text-gray-600">
                    You're {Math.abs(difference).toLocaleString()}{" "}
                    {challenge.unit} ahead of the expected progress
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-orange-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-lg font-semibold text-orange-600">
                    Behind schedule
                  </p>
                  <p className="text-sm text-gray-600">
                    You're {Math.abs(difference).toLocaleString()}{" "}
                    {challenge.unit} behind the expected progress
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskBasedGoalViewProps {
  challenge: Challenge;
  entries: ChallengeEntry[];
  onEntryAdded: () => void;
}

function TaskBasedGoalView({
  challenge,
  entries,
  onEntryAdded,
}: TaskBasedGoalViewProps) {
  const [taskStatuses, setTaskStatuses] = useState<Record<number, boolean>>(
    ((challenge.metadata?.goalTasks || []) as GoalTask[]).reduce(
      (statuses: Record<number, boolean>, _: GoalTask, index: number) => {
        // Check if we have an entry for this task
        const taskEntry = entries.find((entry) =>
          entry.notes?.includes(`Task ${index + 1}`)
        );
        statuses[index] = !!taskEntry && taskEntry.value > 0;
        return statuses;
      },
      {}
    )
  );

  // New state for managing the new task form
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [addTaskError, setAddTaskError] = useState<string | null>(null);

  const tasks = (challenge.metadata?.goalTasks || []) as GoalTask[];
  const completedTasksCount =
    Object.values(taskStatuses).filter(Boolean).length;
  const totalTasksCount = tasks.length;
  const progressPercentage =
    totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  const toggleTaskStatus = async (taskIndex: number) => {
    const newStatus = !taskStatuses[taskIndex];

    try {
      // Create an entry for this task
      const response = await fetch(`/api/challenges/${challenge.id}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          value: newStatus ? 1 : 0, // 1 for completed, 0 for not completed
          notes: `Task ${taskIndex + 1}: ${tasks[taskIndex].description}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      // Update local state
      setTaskStatuses((prev) => ({
        ...prev,
        [taskIndex]: newStatus,
      }));

      // Refresh entries
      onEntryAdded();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Function to add a new task to the goal
  const addNewTask = async () => {
    if (!newTaskDescription.trim()) {
      setAddTaskError("Task description is required");
      return;
    }

    setAddTaskError(null);

    try {
      // Create a new task object
      const newTask: GoalTask = {
        description: newTaskDescription.trim(),
        dueDate: newTaskDueDate || "",
        completed: false,
      };

      // Update the challenge metadata with the new task
      const updatedTasks = [...tasks, newTask];

      // Call the API to update the challenge
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            ...challenge.metadata,
            goalTasks: updatedTasks,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add new task");
      }

      // Clear the form and reset state
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setIsAddingTask(false);

      // Refresh entries
      onEntryAdded();
    } catch (error) {
      console.error("Error adding new task:", error);
      setAddTaskError("Failed to add new task. Please try again.");
    }
  };

  return (
    <div>
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-sm mr-2 text-indigo-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Task Progress
        </h2>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-medium text-gray-700">
              {completedTasksCount}/{totalTasksCount} Tasks
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            {progressPercentage.toFixed(0)}% complete
          </p>
        </div>

        {/* Add New Task Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className={
              isAddingTask
                ? "flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                : "btn-primary flex items-center text-sm font-medium"
            }
          >
            {isAddingTask ? (
              <>Cancel</>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add New Task
              </>
            )}
          </button>
        </div>

        {/* Add New Task Form */}
        {isAddingTask && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Add New Task</h3>

            {addTaskError && (
              <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                {addTaskError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="newTaskDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Task Description *
                </label>
                <input
                  type="text"
                  id="newTaskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe your task..."
                />
              </div>

              <div>
                <label
                  htmlFor="newTaskDueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  id="newTaskDueDate"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={addNewTask}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {tasks.map((task: GoalTask, index: number) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                taskStatuses[index]
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => toggleTaskStatus(index)}
                    className={`h-6 w-6 rounded border ${
                      taskStatuses[index]
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300"
                    } flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {taskStatuses[index] && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="ml-3 flex-1">
                  <p
                    className={`text-base font-medium ${
                      taskStatuses[index]
                        ? "text-gray-500 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {task.description}
                  </p>
                  <div className="mt-1 flex justify-between">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-400 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">
                        Due:{" "}
                        {task.dueDate
                          ? formatDate(task.dueDate)
                          : "No due date"}
                      </span>
                    </div>
                    {taskStatuses[index] && (
                      <span className="text-sm text-green-600 font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-500">
                No tasks yet. Add your first task to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate the total intervals based on frequency
function calculateTotalIntervals(
  startDate: Date,
  endDate: Date,
  frequency: string
): number {
  const diffTime = Math.max(0, endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case "DAILY":
      return diffDays;
    case "WEEKLY":
      return Math.ceil(diffDays / 7);
    case "MONTHLY":
      // Calculate number of months
      return (
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() -
        startDate.getMonth() +
        (endDate.getDate() >= startDate.getDate() ? 1 : 0)
      );
    default:
      return 1;
  }
}
