import { Link } from "react-router-dom";
import { Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
export default function HomeLiveQueue({ liveQueueItems = [] }) {
  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full max-w-full border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Live queue</CardTitle>
          <CardDescription className="text-sm">
            Fast-matching challenges with instant ego tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <span>Ego Meter</span>
              <span>5/10 💅</span>
            </div>
            <Progress value={50} className="mt-3 h-3 bg-primary/20" />
          </div>
          <div className="space-y-3">
            {liveQueueItems.map((item) => (
              <div
                key={`${item.slug || item.title}-${item.players}`}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-popover/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category || "Arcade"} · {item.players || "Live seats open"}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3">
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

      <Card className="w-full max-w-full border-border/70 bg-card/95">
        <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Status
            </p>
            <p className="text-base font-semibold text-foreground">Queue time · 00:12</p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Timer className="size-4" />
            <span className="text-sm font-semibold">Fast lane engaged</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
