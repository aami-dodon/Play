import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Timer } from "lucide-react";
import { toast } from "sonner";

import { fetchCategories, fetchQuestions, fetchQuizzes } from "@/client";
import ChallengeCard from "@/components/ChallengeCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { texts } from "@/texts";
import CategoryFilter from "@/components/CategoryFilter";

const QUESTION_TIME = 60;
const TIMER_CAUTION_THRESHOLD = 30;
const TIMER_DANGER_THRESHOLD = 15;
const SKELETON_CARD_COUNT = 4;

function shuffleArray(items) {
  if (!Array.isArray(items)) return [];
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildQuestionSet(data) {
  const source = Array.isArray(data) ? data : [];
  return shuffleArray(source);
}

const PLAYED_CHALLENGES_KEY = "played_challenges";
const QUIZ_PAGE_SIZE = 8;
const CHALLENGE_LIST_CACHE_KEY = "challenge_list_cache";

function getChallengeCacheKey(category) {
  return `${CHALLENGE_LIST_CACHE_KEY}:${category || "all"}`;
}

function readCachedChallenges(category) {
  if (typeof window === "undefined") return [];
  try {
    const serialized = window.localStorage.getItem(getChallengeCacheKey(category));
    if (!serialized) return [];
    const parsed = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to read cached challenges", error);
    return [];
  }
}

function cacheChallengeList(category, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getChallengeCacheKey(category), JSON.stringify(Array.isArray(data) ? data : []));
  } catch (error) {
    console.warn("Failed to cache challenges", error);
  }
}

function readPlayedChallenges() {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = window.localStorage.getItem(PLAYED_CHALLENGES_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((entry) => typeof entry === "string" && entry.length > 0));
    }
    return new Set();
  } catch (error) {
    console.warn("Failed to parse played challenges list", error);
    return new Set();
  }
}

function markChallengePlayed(slug) {
  if (typeof window === "undefined" || !slug) return;
  const played = readPlayedChallenges();
  played.add(slug);
  window.localStorage.setItem(PLAYED_CHALLENGES_KEY, JSON.stringify([...played]));
}

export default function Challenge() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, [slug]);
  const selectedCategory = searchParams.get("category") || "";

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [startTime, setStartTime] = useState(Date.now());
  const [availableQuizzes, setAvailableQuizzes] = useState(() => readCachedChallenges(selectedCategory));
  const [loadingQuizzes, setLoadingQuizzes] = useState(!slug);
  const [quizzesError, setQuizzesError] = useState("");
  const [quizHasMore, setQuizHasMore] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(!slug);
  const [categoriesError, setCategoriesError] = useState("");

  const quizOffsetRef = useRef(0);
  const quizHasMoreRef = useRef(true);
  const loadingQuizzesRef = useRef(false);
  const loadMoreTriggerRef = useRef(null);
  const isMountedRef = useRef(true);
  const safeSetState = (setter, value) => {
    if (!isMountedRef.current) return;
    setter(value);
  };

  const question = questions[current];
  const totalQuestions = questions.length;
  const shuffledOptions = useMemo(
    () => shuffleArray(question?.options || []),
    [question?.options]
  );
  const availableChallengeCards = useMemo(() => {
    if (!availableQuizzes.length) return [];
    return availableQuizzes.map((quiz) => ({
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description || "You know you want to tap in.",
      category: quiz.category || "Arcade",
      difficulty: quiz.difficulty || "Spicy",
      players: quiz.players_label || quiz.players,
      streak: quiz.streak_label || quiz.streak,
    }));
  }, [availableQuizzes]);

  const hasAvailableChallenges = availableChallengeCards.length > 0;

  const ChallengeGridSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_15px_40px_rgba(2,6,23,0.35)] animate-pulse"
        >
          <div className="h-3 w-32 rounded-full bg-muted/70" />
          <div className="space-y-2">
            <div className="h-5 w-4/5 rounded-full bg-muted/60" />
            <div className="h-3 w-3/5 rounded-full bg-muted/50" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-3/4 rounded-full bg-muted/50" />
            <div className="h-2 w-1/2 rounded-full bg-muted/50" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="h-12 rounded-2xl border border-border/60 bg-popover/70" />
            <div className="h-12 rounded-2xl border border-border/60 bg-popover/70" />
          </div>
          <div className="h-3 rounded-full bg-muted/60" />
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleCategorySelect = (categoryName) => {
    const nextParams = categoryName ? { category: categoryName } : {};
    setSearchParams(nextParams, { replace: true });
  };

  const fetchQuizPage = useCallback(
    async ({ reset = false } = {}) => {
      if (slug) return;
      if (!reset && !quizHasMoreRef.current) return;
      if (loadingQuizzesRef.current) return;

      loadingQuizzesRef.current = true;
      safeSetState(setLoadingQuizzes, true);
      safeSetState(setQuizzesError, "");

      const offset = reset ? 0 : quizOffsetRef.current;
      const params = {
        limit: QUIZ_PAGE_SIZE,
        offset,
        ...(selectedCategory ? { category: selectedCategory } : {}),
      };

      try {
        const response = await fetchQuizzes(params);
        const payload = Array.isArray(response) ? { items: response } : response || {};
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (reset) {
          safeSetState(setAvailableQuizzes, () => {
            cacheChallengeList(selectedCategory, items);
            return items;
          });
        } else {
          safeSetState(setAvailableQuizzes, (prev) => {
            const next = [...prev, ...items];
            cacheChallengeList(selectedCategory, next);
            return next;
          });
        }

        const hasMore =
          typeof payload.hasMore === "boolean" ? payload.hasMore : items.length === QUIZ_PAGE_SIZE;
        quizHasMoreRef.current = hasMore;
        safeSetState(setQuizHasMore, hasMore);

        const nextOffset = payload.nextOffset ?? (offset + items.length);
        quizOffsetRef.current = nextOffset;
      } catch (error) {
        console.error("Failed to load quiz page:", error);
        safeSetState(setQuizzesError, "Could not load the arena. Try refreshing.");
      } finally {
        loadingQuizzesRef.current = false;
        safeSetState(setLoadingQuizzes, false);
      }
    },
    [selectedCategory, slug]
  );

  useEffect(() => {
    if (!slug) {
      return;
    }

    const played = readPlayedChallenges();
    if (played.has(slug)) {
      navigate("/", {
        state: { notice: "You’ve already played this challenge. Try another one!" },
        replace: true,
      });
    }
  }, [slug, navigate]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    fetchQuestions(slug)
      .then((data) => {
        if (!cancelled) {
          setQuestions(buildQuestionSet(data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuestions(buildQuestionSet());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    setCurrent(0);
    setScore(0);
    setSelected(null);
    setRevealed(false);
    setTimeLeft(QUESTION_TIME);
    setStartTime(Date.now());
  }, [slug]);

  useEffect(() => {
    if (slug) {
      setLoadingQuizzes(false);
      setQuizzesError("");
      setAvailableQuizzes([]);
      quizOffsetRef.current = 0;
      quizHasMoreRef.current = false;
      setQuizHasMore(false);
      return;
    }

    quizOffsetRef.current = 0;
    quizHasMoreRef.current = true;
    setQuizHasMore(true);
    fetchQuizPage({ reset: true });
  }, [slug, selectedCategory, fetchQuizPage]);

  const loadMoreElement = loadMoreTriggerRef.current;
  useEffect(() => {
    if (slug || !loadMoreElement) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && quizHasMoreRef.current && !loadingQuizzesRef.current) {
          fetchQuizPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [slug, fetchQuizPage, loadMoreElement]);

  useEffect(() => {
    if (slug) {
      setCategories([]);
      setCategoriesError("");
      setLoadingCategories(false);
      return;
    }

    let cancelled = false;
    setLoadingCategories(true);
    fetchCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(Array.isArray(data) ? data : []);
          setCategoriesError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setCategoriesError("Could not load the category overview right now.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
  }, [current, totalQuestions]);

  const handleTimeout = useCallback(() => {
    if (revealed || !totalQuestions) return;
    setRevealed(true);
    setSelected(null);
    toast.warning(texts.toasts.timeout);
  }, [revealed, totalQuestions]);

  useEffect(() => {
    if (!question || revealed) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [question, revealed, handleTimeout]);

  const correctAnswer = useMemo(() => {
    if (!question) return "";
    return (
      question.correct_option ||
      question.answer ||
      question.correctAnswer ||
      question.correct ||
      ""
    );
  }, [question]);

  const progressValue = totalQuestions ? ((current + 1) / totalQuestions) * 100 : 0;
  const egoScore = totalQuestions ? Math.round((score / totalQuestions) * 10) : 0;
  const egoLabel = texts.challenge.egoMeter(Math.max(egoScore, 1));
  const timerDisplay = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timeLeft]);

  const timerColor = useMemo(() => {
    if (timeLeft <= TIMER_DANGER_THRESHOLD) {
      return "#ef4444"; // red
    }
    if (timeLeft <= TIMER_CAUTION_THRESHOLD) {
      return "#facc15"; // yellow
    }
    return "#ffffff";
  }, [timeLeft]);

  const handleAnswer = (option) => {
    if (revealed) return;
    const isCorrect = option === correctAnswer;
    setSelected(option);
    setRevealed(true);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast.success(texts.toasts.correct);
    } else {
      toast.error(texts.toasts.wrong);
    }
  };

  const goToResults = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const slugSegment = slug || "demo";
    if (slug) {
      markChallengePlayed(slug);
    }
    navigate(`/results/${slugSegment}?score=${score}&time=${timeTaken}&total=${totalQuestions}`);
  };

  const handleNext = () => {
    if (current + 1 < totalQuestions) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(QUESTION_TIME);
    } else {
      goToResults();
    }
  };

  if (!slug) {
    return (
      <div className="space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              Challenge Arcade
            </p>
            <CardTitle className="text-3xl font-semibold">Pick your chaos.</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Browse the live quizzes straight from your database. Each run is unique, snark included.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <Badge variant="secondary" className="rounded-full px-3 text-[0.6rem] tracking-[0.3em]">
              {availableQuizzes.length || "—"} challenges
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 text-[0.6rem] tracking-[0.3em]">
              {loadingQuizzes ? "Syncing data..." : "Powered by your DB"}
            </Badge>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Available challenges
              </p>
              <p className="text-2xl font-semibold text-foreground hero-subtitle-animate">
                Tap any card to jump into that quiz instantly.
              </p>
            </div>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              loading={loadingCategories}
              error={categoriesError}
              onSelectCategory={handleCategorySelect}
            />
          </div>
          {hasAvailableChallenges ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {availableChallengeCards.map((challenge) => (
                  <ChallengeCard key={challenge.slug} challenge={challenge} ctaLabel="Play" />
                ))}
              </div>
              {loadingQuizzes && (
                <div className="rounded-2xl border border-border/60 bg-popover/80 p-4 text-sm text-muted-foreground">
                  Syncing the arena for your selection…
                </div>
              )}
            </>
          ) : loadingQuizzes ? (
            <ChallengeGridSkeleton />
          ) : (
            <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
              {quizzesError || "No quizzes found. Add some via the backend to get started."}
            </Card>
          )}
          {quizHasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-6"
                onClick={() => fetchQuizPage()}
                disabled={loadingQuizzes}
              >
                {loadingQuizzes ? "Loading more challenges..." : "Load more challenges"}
              </Button>
            </div>
          )}
          <div ref={loadMoreTriggerRef} aria-hidden="true" className="h-2" />
        </section>
      </div>
    );
  }

  if (!question) {
    return (
      <Card className="mx-auto max-w-2xl border-border/70 bg-card/95 p-6 text-center">
        <p className="text-sm font-semibold text-muted-foreground">{texts.challenge.emptyState}</p>
      </Card>
    );
  }

    return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:h-[calc(100vh-180px)] lg:flex-row lg:gap-6">
      <Card className="flex flex-1 flex-col border-border/70 bg-card/95 lg:overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <Badge variant="secondary" className="rounded-full px-3">
              {question.category || "Arcade"}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 text-[0.6rem] tracking-[0.3em]">
              {slug || "demo"}
            </Badge>
            <span>
              Question {current + 1} / {totalQuestions}
            </span>
          </div>
          <CardTitle className="text-2xl font-semibold leading-snug text-foreground">
            {question.question_text}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {texts.challenge.prompt}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 lg:overflow-hidden">
          <div className="flex-1 space-y-3 lg:overflow-y-auto lg:pr-1">
            {shuffledOptions.map((option) => {
              const isCorrect = option === correctAnswer;
              const isWrongSelection = revealed && selected === option && !isCorrect;
              return (
                <Button
                  key={option}
                  variant="outline"
                  disabled={revealed}
                  className={cn(
                    "h-auto justify-start rounded-2xl border-2 border-border/70 bg-background/80 px-4 py-4 text-left text-base font-semibold text-foreground transition-all",
                    revealed && isCorrect && "border-chart-1 bg-chart-1/20 text-primary",
                    isWrongSelection && "border-destructive/80 bg-destructive/15 text-destructive"
                  )}
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </Button>
              );
            })}

            {revealed && question.explanation && (
              <div className="rounded-2xl border border-border/60 bg-popover/80 p-4 text-sm text-muted-foreground">
                <p>
                  <span role="img" aria-hidden="true">
                    💡
                  </span>{" "}
                  <strong className="text-foreground">Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              {revealed ? "Next Victim — I mean, Challenge." : "Lock in before the timer throws shade."}
            </p>
            <Button
              size="lg"
              className="rounded-full px-8"
              disabled={!revealed}
              onClick={handleNext}
            >
              {current + 1 === totalQuestions ? "See Results" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-80 lg:shrink-0 lg:grid-cols-1">
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {texts.challenge.scoreLabel}
            </p>
            <p className="text-4xl font-semibold text-foreground">{score}</p>
            <p className="text-sm text-muted-foreground">Out of {totalQuestions}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 text-primary-foreground">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/80">
              <span>{texts.challenge.timerLabel}</span>
              <Timer className="size-4" style={{ color: timerColor }} />
            </div>
            <p className="font-mono text-4xl" style={{ color: timerColor }}>{timerDisplay}</p>
            <p className="text-xs text-primary-foreground/80">60s per question</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <span>{texts.challenge.progressLabel}</span>
              <span>
                {current + 1}/{totalQuestions}
              </span>
            </div>
            <Progress value={progressValue} className="h-3 bg-primary/20" />
            <p className="text-sm font-semibold text-muted-foreground">{egoLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Challenge
            </p>
            <p className="text-base font-semibold text-foreground">
              {question.quiz_title || question.category || slug || "Arcade run"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
