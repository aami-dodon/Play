import { Link } from "react-router-dom";

import ChallengeCard from "@/components/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { texts } from "@/texts";

export default function HomeFeatured({ challenges = [], loading, featuredFallback }) {
  return (
    <section id="featured" className="space-y-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {texts.home.featured.title}
        </p>
        <h2 className="text-2xl font-semibold text-foreground hero-subtitle-animate">
          {texts.home.featured.subtitle}
        </h2>
      </div>
      {loading ? (
        <Card className="w-full max-w-full border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
          Loading challenges...
        </Card>
      ) : (
        <>
          <div className="grid w-full max-w-full gap-4 md:grid-cols-2">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.slug || challenge.title} challenge={challenge} />
            ))}
          </div>
          {featuredFallback && (
            <Card className="w-full max-w-full border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
              No challenges found in the database yet. Add a quiz through the backend to see it on
              the home page.
            </Card>
          )}
          <div className="flex w-full justify-end">
            <Button asChild variant="link">
              <Link to="/challenge">View all challenges →</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
