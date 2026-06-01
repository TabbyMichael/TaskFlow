import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(iso?: string | null, fmt = "MMM d, yyyy") {
  if (!iso) return "—";
  const d = new Date(iso);
  return isValid(d) ? format(d, fmt) : "—";
}

export function relativeTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
