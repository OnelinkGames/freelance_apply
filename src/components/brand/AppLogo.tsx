import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  title?: string;
};

export function AppLogo({ className, title = "Freelance Flow" }: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="ff-logo-bg" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="ff-logo-flow" x1="7" y1="11" x2="24" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ff-logo-bg)" />
      <rect x="6" y="15" width="5" height="11" rx="1.5" fill="#FFFFFF" fillOpacity="0.45" />
      <rect x="13.5" y="11" width="5" height="15" rx="1.5" fill="#FFFFFF" fillOpacity="0.72" />
      <rect x="21" y="7" width="5" height="19" rx="1.5" fill="#FFFFFF" />
      <path
        d="M8.5 12.5C11.5 9.5 16 9 20.5 11.5"
        stroke="url(#ff-logo-flow)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M19.5 10.5L21.5 11.5L19.5 12.5"
        stroke="#FFFFFF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="23.5" cy="8.5" r="1.25" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}
