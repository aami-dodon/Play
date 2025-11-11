import { Card, CardContent } from "./ui/card";

export default function StatTiles({ stats = [], dense }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/60 bg-popover/80">
          <CardContent className={dense ? "px-4 py-4" : undefined}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            {stat.helper && (
              <p className="text-sm text-muted-foreground">{stat.helper}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
