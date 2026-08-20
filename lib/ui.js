// Client-safe helpers shared across screens

export const STATUS_META = {
  clean: { label: "Clean", emoji: "✨", color: "#1e8a4c", bg: "#e3f5ea" },
  ok: { label: "Usable", emoji: "👍", color: "#8a6d1e", bg: "#faf3d9" },
  dirty: { label: "Dirty", emoji: "🤢", color: "#b3541e", bg: "#fdeadd" },
  out_of_order: { label: "Out of order", emoji: "🚫", color: "#a12626", bg: "#fbe3e3" },
  unknown: { label: "Unknown", emoji: "❓", color: "#5c5c66", bg: "#ededf0" },
};

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.unknown;
}

// Absolute date/time in campus-local Central Time, e.g. "Aug 20, 2:13 PM"
export function dateLabel(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso) {
  if (!iso) return "never reported";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}
