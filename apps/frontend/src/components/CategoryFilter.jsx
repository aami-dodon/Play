import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CategoryFilter({
  categories = [],
  selectedCategory = "",
  loading,
  error,
  onSelectCategory,
}) {
  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const helperText = loading
    ? "Syncing with the arena…"
    : hasCategories
    ? `${categories.length} categories live`
    : "Add a quiz to unlock category filters.";

  const items = [
    { value: "all", label: "All categories" },
    ...(hasCategories
      ? categories.map((category) => ({
          value: category.category || `uncategorized-${category.totalChallenges || 0}`,
          label: category.category || "Uncategorized",
        }))
      : []),
  ];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 text-right">
        <div className="space-y-1">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Filter the chaos
          </p>
          <p className="text-sm font-semibold text-foreground">Pick a category</p>
        </div>
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) =>
            onSelectCategory && onSelectCategory(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px] justify-between border border-border/60 bg-background/80 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value || "all"} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">{helperText}</p>
      {error && (
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
