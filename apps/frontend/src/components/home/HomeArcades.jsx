import { Link } from "react-router-dom";

import ChallengeCard from "@/components/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { texts } from "@/texts";

export default function HomeArcades({ arcades = [], loading }) {
  const hasArcades = arcades.length > 0;

  return (
    <section id="arcades" className="space-y-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {texts.home.arcades.title}
        </p>
        <h2 className="text-2xl font-semibold text-foreground hero-subtitle-animate">
          {texts.home.arcades.subtitle}
        </h2>
      </div>

      {loading ? (
        <Card className="w-full max-w-full border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
          {texts.home.arcades.loading}
        </Card>
      ) : hasArcades ? (
        <div className="grid w-full max-w-full gap-4 md:grid-cols-2">
          {arcades.map((arcade) => (
            <ChallengeCard
              key={arcade.slug || arcade.title}
              challenge={arcade}
              ctaLabel={texts.arcade.cardCta}
            />
          ))}
        </div>
      ) : (
        <Card className="w-full max-w-full border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
          {texts.home.arcades.emptyState || texts.arcade.emptyState}
        </Card>
      )}

      {!loading && (
        <div className="flex w-full justify-end">
          <Button asChild variant="link">
            <Link to="/arcade">{texts.home.arcades.cta}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
