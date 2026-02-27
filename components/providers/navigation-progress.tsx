"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar that appears at the top of the page during navigation.
 * Uses a fake-progress animation (like YouTube / GitHub) since we can't know
 * the real completion percentage.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kick off a new progress bar on every navigation
  useEffect(() => {
    // Clear any in-flight timers from a previous navigation
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);

    // Start from 0, animate to ~85 % quickly then slow down
    setProgress(0);
    setVisible(true);

    let current = 0;
    timerRef.current = setInterval(() => {
      current += current < 40 ? 8 : current < 70 ? 4 : current < 85 ? 1 : 0.3;
      if (current >= 90) {
        clearInterval(timerRef.current!);
      }
      setProgress(Math.min(current, 90));
    }, 50);

    // "Complete" the bar shortly after the page component mounts
    completeRef.current = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeRef.current) clearTimeout(completeRef.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none"
      style={{ background: "transparent" }}
    >
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${progress}%`,
          background: "var(--color-primary, #d4a958)",
          boxShadow: "0 0 8px var(--color-primary, #d4a958)",
          transitionDuration: progress === 100 ? "200ms" : "150ms",
        }}
      />
    </div>
  );
}