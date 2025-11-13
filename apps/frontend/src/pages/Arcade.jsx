import ChallengeCard from "@/components/ChallengeCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { texts } from "@/texts";

const arcadeGames = [
  {
    slug: "snake",
    title: "Snake Game",
    description:
      "Classic grid chase with leaderboard submissions, tighter controls, and a hunter that never rests.",
    category: "Arcade",
    difficulty: "Chill",
    players: "Solo run",
    streak: "Endless evasion",
    href: "/snake",
  },
];

export default function Arcade() {
  const totalGames = arcadeGames.length;
  const gamesLabel = `${totalGames} arcade run${totalGames === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            {texts.arcade.hero.eyebrow}
          </p>
          <CardTitle className="text-3xl font-semibold">{texts.arcade.hero.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {texts.arcade.hero.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          <Badge variant="secondary" className="rounded-full px-3 text-[0.6rem] tracking-[0.3em]">
            {gamesLabel}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 text-[0.6rem] tracking-[0.3em]">
            Same layout as the Challenge arena
          </Badge>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              {texts.arcade.sectionTitle}
            </p>
            <p className="text-2xl font-semibold text-foreground hero-subtitle-animate">
              {texts.arcade.sectionSubtitle}
            </p>
          </div>
        </div>

        {totalGames ? (
          <div className="grid gap-4 md:grid-cols-2">
            {arcadeGames.map((game) => (
              <ChallengeCard
                key={game.slug}
                challenge={game}
                ctaLabel={texts.arcade.cardCta}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
            {texts.arcade.emptyState}
          </Card>
        )}
      </section>
    </div>
  );
}
