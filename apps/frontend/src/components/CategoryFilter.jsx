import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CategoryFilter({
  categories = [],
  selectedCategory = "",
  loading,
  error,
  onSelectCategory,
}) {
  const hasCategories = Array.isArray(categories) && categories.length > 0;
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
    <div className="flex w-full flex-col gap-2 text-right sm:flex-row sm:items-center sm:justify-end sm:text-left">
      <div className="w-full max-w-[220px] sm:w-[180px]">
        <Select
          value={selectedCategory || "all"}
          disabled={loading}
          onValueChange={(value) =>
            onSelectCategory && onSelectCategory(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full justify-between border border-border/60 bg-background/80 text-sm">
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
      {error && (
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
