import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function HomeLiveQueue({ liveQueueItems = [] }) {
  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full max-w-full border border-primary/30 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-900/40 text-white shadow-[0_25px_55px_rgba(4,6,15,0.7)] backdrop-blur-xl animate-[live-queue-glow_8s_ease-in-out_infinite_alternate]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Live queue</CardTitle>
          <CardDescription className="text-sm text-slate-200">
            Fast-matching challenges with instant ego tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              <span>Ego Meter</span>
              <span>5/10 💅</span>
            </div>
            <Progress value={50} className="mt-3 h-3 bg-cyan-400/30" />
          </div>
          <div className="space-y-3">
            {liveQueueItems.map((item) => (
              <div
                key={`${item.slug || item.title}-${item.players}`}
                className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-white/70">
                    {item.category || "Arcade"} · {item.players || "Live seats open"}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 text-xs uppercase tracking-[0.3em] text-white/90">
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
