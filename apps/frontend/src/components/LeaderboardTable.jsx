import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export default function LeaderboardTable({
  title,
  subtitle,
  players = [],
  highlightPlayer,
  caption,
  compact,
}) {
  return (
    <Card className="border-border/70 bg-card/95">
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={compact ? "px-4" : undefined}>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bragging rights yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((entry, index) => (
                <TableRow
                  key={`${entry.player}-${index}`}
                  data-state={
                    highlightPlayer && entry.player === highlightPlayer ? "selected" : undefined
                  }
                >
                  <TableCell className="font-semibold text-muted-foreground">
                    {entry.rank ?? index + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{entry.player}</TableCell>
                  <TableCell className="text-primary font-semibold">{entry.score}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full px-3 text-xs">
                      {entry.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {caption && <TableCaption>{caption}</TableCaption>}
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
