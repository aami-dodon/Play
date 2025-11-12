import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function HomeLiveQueue({ liveQueueItems = [] }) {
  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full max-w-full border border-primary/30 live-queue-card-bg text-[var(--card-foreground)] shadow-[0_25px_55px_var(--primary)] backdrop-blur-xl animate-[live-queue-glow_8s_ease-in-out_infinite_alternate]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--card-foreground)]">Live queue</CardTitle>
          <CardDescription className="text-sm text-[var(--muted-foreground)]">
            Fast-matching challenges with instant ego tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-2xl border px-4 py-4 backdrop-blur-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "color-mix(in srgb, var(--card), transparent 70%)",
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
              <span>Ego Meter</span>
              <span className="text-[var(--primary)]">5/10 💅</span>
            </div>
            <Progress
              value={50}
              className="mt-3 h-3"
              style={{ backgroundColor: "color-mix(in srgb, var(--primary), transparent 40%)" }}
            />
          </div>
          <div className="space-y-3">
            {liveQueueItems.map((item) => (
              <div
                key={`${item.slug || item.title}-${item.players}`}
                className="flex items-center justify-between rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "color-mix(in srgb, var(--card), transparent 65%)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--card-foreground)]">{item.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {item.category || "Arcade"} · {item.players || "Live seats open"}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 text-xs uppercase tracking-[0.3em]">
                  Live
                </Badge>
              </div>
            ))}
          </div>
          <Button asChild className="w-full rounded-2xl py-6 text-base font-semibold">
            <Link to="/challenge">Queue me before I cool off</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
