import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ChallengeCard from "@/components/ChallengeCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchArcadeCategories } from "@/client";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryParam = searchParams.get("category") || "";
  const normalizedCategoryFilter = selectedCategoryParam.trim().toLowerCase();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setCategoriesLoading(true);
    setCategoriesError("");

    const loadCategories = async () => {
      try {
        const response = await fetchArcadeCategories();
        if (!isMounted) return;
        setCategories(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Failed to load categories", error);
        if (isMounted) {
          setCategoriesError("Category filter unavailable");
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedArcadeGames = useMemo(() => {
    if (!normalizedCategoryFilter) {
      return arcadeGames;
    }
    return arcadeGames.filter((game) => {
      const gameCategory = (game.category || "").trim().toLowerCase();
      return gameCategory === normalizedCategoryFilter;
    });
  }, [normalizedCategoryFilter]);

  const totalGames = displayedArcadeGames.length;
  const gamesLabel = `${totalGames} arcade run${totalGames === 1 ? "" : "s"}`;

  const handleCategorySelect = (categoryName) => {
    const nextParams = categoryName ? { category: categoryName } : {};
    setSearchParams(nextParams, { replace: true });
  };

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
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategoryParam}
            loading={categoriesLoading}
            error={categoriesError}
            onSelectCategory={handleCategorySelect}
          />
        </div>

        {totalGames ? (
          <div className="grid gap-4 md:grid-cols-2">
            {displayedArcadeGames.map((game) => (
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
