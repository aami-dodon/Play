import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { texts } from "@/texts";

export default function HomeLeaderboardPreview({ loadingLeaderboard, leaderboardRows = [] }) {
  return (
    <section className="space-y-4">
      <div className="flex w-full flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {texts.home.leaderboardPreview.title}
        </p>
        <p className="text-2xl font-semibold text-foreground hero-subtitle-animate">
          {texts.home.leaderboardPreview.subtitle}
        </p>
      </div>
      {loadingLeaderboard ? (
        <Card className="w-full max-w-full border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
          Loading leaderboard...
        </Card>
      ) : (
        <>
          <Card className="w-full max-w-full border-border/70 bg-card/95">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold">Sneak peek</CardTitle>
              <CardDescription>Overall standings across every challenge.</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Challenge</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardRows.slice(0, 5).map((entry, index) => (
                    <TableRow key={`${entry.player}-${index}`}>
                      <TableCell className="text-muted-foreground">{entry.rank ?? index + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">{entry.player}</TableCell>
                      <TableCell className="text-primary font-semibold">{entry.score}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full px-2 text-[0.65rem]">
                          {entry.category || "Arcade"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-normal">
                        {entry.challengeName || entry.challenge || "Challenge"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {entry.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button asChild variant="link">
              <Link to="/leaderboard">View full leaderboard →</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
