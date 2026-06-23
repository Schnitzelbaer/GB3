import { cn } from "@/lib/utils";

/**
 * Stylised Canton of Zürich coat of arms (diagonal arms) for the header.
 * Drawn white with the cantonal blue diagonal so it stays legible on the
 * blue header bar. Drop the official lion logo into /public to replace.
 */
export function ZhCrest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 28"
      className={cn("h-7 w-auto", className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="zh-crest-clip">
          <path d="M2 1.5H22V15C22 21.6 17.2 25.7 12 27C6.8 25.7 2 21.6 2 15Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#zh-crest-clip)">
        <rect x="0" y="0" width="24" height="28" fill="#ffffff" />
        <path d="M-3 30 L27 -2" stroke="var(--zh-blue)" strokeWidth="2.6" />
      </g>
      <path
        d="M2 1.5H22V15C22 21.6 17.2 25.7 12 27C6.8 25.7 2 21.6 2 15Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.4"
      />
    </svg>
  );
}
