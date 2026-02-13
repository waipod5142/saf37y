/**
 * Shared date and time utilities for Firebase timestamp handling and formatting
 * Provides consistent date/time formatting across the application
 */

// Utility function for Firebase timestamp conversion
export function convertFirebaseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  // If it has toDate method (actual Firebase Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a serialized timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  
  // Fallback to regular Date parsing
  return new Date(timestamp);
}

// Get relative time string (e.g., "5 minutes ago", "2 hours ago")
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
}

// Format date as DD/MM/YYYY
export function formatDateOnly(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format time as HH:MM:SS
export function formatTimeOnly(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Comprehensive date/time formatting with all components
export function formatDateTime(date: Date): { 
  relativeTime: string; 
  formattedDate: string; 
  formattedTime: string; 
  combined: string; 
} {
  const relativeTime = getRelativeTime(date);
  const formattedDate = formatDateOnly(date);
  const formattedTime = formatTimeOnly(date);
  const combined = `${relativeTime} - ${formattedDate}, ${formattedTime}`;
  
  return {
    relativeTime,
    formattedDate,
    formattedTime,
    combined
  };
}

// Main utility function for formatting Firebase timestamps to relative date/time
export function formatRelativeDateTime(timestamp: any): string {
  try {
    const recordDate = convertFirebaseTimestamp(timestamp);
    if (recordDate) {
      const dateTimeInfo = formatDateTime(recordDate);
      return dateTimeInfo.combined;
    }
    return "Unknown Date/Time";
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Date";
  }
}

// Legacy function names for backward compatibility
export const formatDate = formatDateOnly;
export const formatTime = formatTimeOnly;