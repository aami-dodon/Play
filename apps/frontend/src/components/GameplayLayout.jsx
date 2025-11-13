import { cn } from "@/lib/utils";

export default function GameplayLayout({
  children,
  sidebar,
  className,
  sidebarWrapperClassName,
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-4 lg:h-[calc(100vh-180px)] lg:flex-row lg:gap-6",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-4 lg:min-w-0">{children}</div>
      {sidebar ? (
        <div
          className={cn(
            "grid w-full gap-4 sm:grid-cols-2 lg:w-80 lg:shrink-0 lg:grid-cols-1",
            sidebarWrapperClassName
          )}
        >
          {sidebar}
        </div>
      ) : null}
    </div>
  );
}
