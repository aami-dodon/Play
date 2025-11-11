export const texts = {
  brand: {
    name: "Play",
    tagline: "Sarcasm-fueled trivia arena.",
    punchline: "Play",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Challenges", href: "/challenge" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  toasts: {
    correct: "Lucky guess, admit it.",
    wrong: "Oof. Not even close, but we admire the confidence.",
    timeout: "You blinked. That's on you.",
    achievement: "Congrats, you did something!",
  },
  home: {
    hero: {
      eyebrow: "Live challenge queue",
      title: "Think you're smart? Prove it. Or at least try.",
      description:
        "Micro challenges, zero chill copy, and dopamine hits faster than your Wi-Fi router drops packets.",
      primaryCta: "Play Now — before your brain cools off.",
      secondaryCta: "Browse Challenges",
      stats: [
        { label: "Brains roasted", value: "12,487", helper: "today alone" },
        { label: "Perfect streaks", value: "37", helper: "show-offs" },
        { label: "Avg. ego meter", value: "6.2/10", helper: "room to fall" },
      ],
    },
    featured: {
      title: "Featured challenges",
      subtitle: "Fresh drops with more attitude than your group chat.",
      placeholderChallenges: [
        {
          slug: "wifi-router-genius",
          title: "Are You Smarter Than Your Wi-Fi Router?",
          description: "Diagnose chaotic gadgets before the rage-quit hits.",
          category: "Tech",
          difficulty: "Chaotic",
        },
        {
          slug: "emoji-cinema",
          title: "Guess That Emoji Movie!",
          description: "Decode the cinematic hieroglyphics.",
          category: "Pop Culture",
          difficulty: "Chaotic",
        },
        {
          slug: "dramatic-history",
          title: "History, but make it dramatic.",
          description: "All the wars, none of the dust.",
          category: "History",
          difficulty: "Spicy",
        },
      ],
    },
    leaderboardPreview: {
      title: "Hall of Fame (and occasional shame).",
      subtitle: "These legends answered faster than you can Google.",
    },
  },
  challenge: {
    timerLabel: "Time left",
    scoreLabel: "Score",
    progressLabel: "Progress",
    egoMeter: (score) => `Ego Meter: ${score}/10 💅`,
    prompt: "Next Victim — I mean, Challenge.",
    emptyState: "Loading a fiendish puzzle...",
  },
  results: {
    heading: "Well, well, well… look who survived the Challenge.",
    copy: "Respectable. But not enough for a TED Talk.",
    feedback: [
      { threshold: 0.8, line: "Okay prodigy, share it before it cools down." },
      { threshold: 0.5, line: "Respectable chaos control. Do it again." },
      { threshold: 0, line: "Participation trophy unlocked. Proud of you, kinda." },
    ],
    buttons: {
      replay: "Play Again",
      tryAnother: "Try Another Challenge",
      share: "Share Score",
    },
  },
  profile: {
    title: "Pilot profile",
    subtitle: "Stats, streaks, and receipts for your flex.",
    stats: [
      { label: "Challenges played", value: 42, helper: "since Tuesday" },
      { label: "Accuracy", value: "74%", helper: "aim higher" },
      { label: "Current streak", value: "6 wins", helper: "don't blink" },
      { label: "Fastest run", value: "43s", helper: "Fastest Finger" },
    ],
    achievements: [
      { icon: "✨", title: "The Try-Hard Badge", description: "Completed every daily drop for a week." },
      { icon: "💀", title: "10 Wrong Answers in a Row", description: "Committed to the bit. Respect." },
      { icon: "🔥", title: "Fastest Finger in the West", description: "Answered in under 2 seconds. Show-off." },
    ],
  },
  leaderboard: {
    title: "The Hall of Fame (and occasional shame).",
    subtitle: "Flex responsibly. Or don't.",
    filters: ["All Time", "This Week", "Today"],
    mockPlayers: [
      { player: "PixelBandit", score: 9800, category: "Emoji Cinema", time: "36s" },
      { player: "LagWizard", score: 9475, category: "Wi-Fi Whisperer", time: "41s" },
      { player: "TriviaGoblin", score: 9100, category: "Historic Drama", time: "55s" },
      { player: "404NotFound", score: 8800, category: "Emoji Cinema", time: "60s" },
      { player: "ObviousPlant", score: 8600, category: "Wi-Fi Whisperer", time: "64s" },
    ],
  },
};

export const leaderboardPreviewPlayers = [
  { player: "PixelBandit", score: 9800, category: "Emoji Cinema", time: "36s" },
  { player: "LagWizard", score: 9475, category: "Wi-Fi Whisperer", time: "41s" },
  { player: "TriviaGoblin", score: 9100, category: "Historic Drama", time: "55s" },
];

export const resultShareText = (score) =>
  `I survived Play with ${score} points. Barely.`;
