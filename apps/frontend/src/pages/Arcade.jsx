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
import { fetchArcadeCategories, fetchArcades } from "@/client";
import { texts } from "@/texts";

export default function Arcade() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryParam = searchParams.get("category") || "";
  const normalizedCategoryParam = selectedCategoryParam.trim();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [arcadeGames, setArcadeGames] = useState([]);
  const [arcadesLoading, setArcadesLoading] = useState(true);
  const [arcadesError, setArcadesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const result = await fetchArcadeCategories();
        if (!isMounted) return;
        setCategories(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Failed to load arcade categories", error);
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

  useEffect(() => {
    let isMounted = true;

    const loadArcades = async () => {
      setArcadesLoading(true);
      setArcadesError("");
      try {
        const params = normalizedCategoryParam ? { category: normalizedCategoryParam } : {};
        const result = await fetchArcades(params);
        if (!isMounted) return;
        setArcadeGames(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Failed to load arcades", error);
        if (isMounted) {
          setArcadesError("Arcade lineup unavailable. Try again soon.");
        }
      } finally {
        if (isMounted) {
          setArcadesLoading(false);
        }
      }
    };

    loadArcades();
    return () => {
      isMounted = false;
    };
  }, [normalizedCategoryParam]);

  const displayedArcadeGames = useMemo(() => arcadeGames, [arcadeGames]);
  const totalGames = displayedArcadeGames.length;
  const gamesLabel = arcadesLoading
    ? "Loading arcade runs…"
    : `${totalGames} arcade run${totalGames === 1 ? "" : "s"}`;
  const showArcadeGrid = totalGames > 0;
  const showInitialLoading = arcadesLoading && !showArcadeGrid;

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
            Arcade-ready from UI to controls
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
            selectedCategory={normalizedCategoryParam}
            loading={categoriesLoading}
            error={categoriesError}
            onSelectCategory={handleCategorySelect}
          />
        </div>

        {showInitialLoading ? (
          <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
            Loading the arcade lineup...
          </Card>
        ) : showArcadeGrid ? (
          <>
            {arcadesLoading && (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Updating the arcade lineup…
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {displayedArcadeGames.map((game) => (
                <ChallengeCard
                  key={game.slug}
                  challenge={game}
                  ctaLabel={texts.arcade.cardCta}
                />
              ))}
            </div>
          </>
        ) : (
          <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
            {arcadesError || texts.arcade.emptyState}
          </Card>
        )}
      </section>
    </div>
  );
}
