// Format a date string into a user-friendly format
export function formatDate(dateString: string): string {
  if (!dateString) return "Unknown";

  try {
    // Split by T to handle both ISO strings and date-only strings
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);

    // Create a date at noon to avoid any potential timezone issues
    // This ensures we're working with the same date regardless of timezone
    const date = new Date(year, month - 1, day, 12, 0, 0);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Invalid Date";
  }
}
