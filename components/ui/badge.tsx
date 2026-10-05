import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium tracking-[0.14em] text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
