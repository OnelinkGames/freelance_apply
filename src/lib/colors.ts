export type IndicatorColor = "green" | "yellow" | "orange" | "red" | "neutral";

export function getWaitingColor(days: number): IndicatorColor {
  if (days <= 15) return "green";
  if (days <= 30) return "orange";
  return "red";
}

export function getProgressColor(percent: number): IndicatorColor {
  if (percent <= 70) return "green";
  if (percent <= 85) return "yellow";
  return "red";
}

export const indicatorClasses: Record<IndicatorColor, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  yellow: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  orange: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
};

export const cardBorderClasses: Record<IndicatorColor, string> = {
  green: "border-l-emerald-500",
  yellow: "border-l-amber-500",
  orange: "border-l-orange-500",
  red: "border-l-red-500",
  neutral: "border-l-slate-300 dark:border-l-slate-600",
};
