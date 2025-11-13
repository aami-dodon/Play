import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function GameplaySidebarCard({
  label,
  children,
  className,
  contentClassName,
  labelClassName,
}) {
  return (
    <Card className={cn("border-border/70 bg-card/95", className)}>
      <CardContent className={cn("space-y-2 p-5", contentClassName)}>
        {label ? (
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground",
              labelClassName
            )}
          >
            {label}
          </div>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
