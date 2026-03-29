import { forwardRef } from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import clsx from "clsx";

const Progress = forwardRef(function Progress({ className, value = 0, ...props }, ref) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={clsx(
        "relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]",
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--color-cyan)] transition-transform"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

export default Progress;
