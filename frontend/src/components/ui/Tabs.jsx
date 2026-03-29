import { forwardRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";

export function Tabs({ children, ...props }) {
  return <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>;
}

export const TabsList = forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={clsx(
        "inline-flex rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-1",
        className
      )}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef(function TabsTrigger(
  { className, ...props },
  ref
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={clsx(
        "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors data-[state=active]:bg-[var(--color-cyan-dim)] data-[state=active]:text-[var(--color-cyan)]",
        className
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef(function TabsContent(
  { className, ...props },
  ref
) {
  return <TabsPrimitive.Content ref={ref} className={className} {...props} />;
});

export default Tabs;
