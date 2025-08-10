import styles from "./OutputSelector.module.css";

type OutputType =
  | "caption"
  | "hashtags"
  | "bio"
  | "dm"
  | "comments"
  | "story"
  | "hook";

// Treat "starter" as PRO-level access for outputs.
// If you want stricter gating, I can change this mapping.
type Plan = "free" | "starter" | "pro" | "premium";

type OutputOption = {
  key: OutputType;
  label: string;
  description: string;
  emoji: string;
  tier: Exclude<Plan, "starter">; // visual tier: "free" | "pro" | "premium"
};

const OPTIONS: OutputOption[] = [
  { key: "caption",  label: "Captions",          emoji: "📝", description: "Creative on-brand text for posts",     tier: "free" },
  { key: "hashtags", label: "Hashtags",          emoji: "#️⃣", description: "Relevant, trending tags",              tier: "pro" },
  { key: "bio",      label: "Bio",               emoji: "✍️", description: "Polished profile bio",                  tier: "pro" },
  { key: "comments", label: "Comments",          emoji: "💬", description: "Growth-boosting comment ideas",         tier: "pro" },
  { key: "story",    label: "Stories",           emoji: "📲", description: "Engaging story prompts",                tier: "pro" },
  { key: "dm",       label: "DMs",               emoji: "💌", description: "Flirty messages for fans",              tier: "premium" },
  { key: "hook",     label: "Hooks / Overlays",  emoji: "🎯", description: "Punchy openings & on-video text",       tier: "premium" },
];

type Props = {
  selected: OutputType[];
  onChange: (newSelected: OutputType[]) => void;
  userPlan: Plan;
};

export const OutputSelector = ({ selected, onChange, userPlan }: Props) => {
  const isAllowed = (tier: OutputOption["tier"]): boolean => {
    if (userPlan === "premium") return true;
    if (userPlan === "pro" || userPlan === "starter") return tier !== "premium";
    // free plan:
    return tier === "free";
  };

  const toggleOption = (key: OutputType, tier: OutputOption["tier"]) => {
    if (!isAllowed(tier)) {
      alert("This feature is available on a higher plan.");
      return;
    }

    const updated = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];

    onChange(updated);
  };

  return (
    <div className={styles.container}>
      {OPTIONS.map(({ key, label, description, emoji, tier }) => {
        const checked = selected.includes(key);
        const locked =
          (tier === "pro" && (userPlan === "free")) ||
          (tier === "premium" && userPlan !== "premium");

        return (
          <button
            key={key}
            type="button"
            className={`${styles.card} ${checked ? styles.checked : ""} ${
              locked ? styles.locked : ""
            }`}
            onClick={() => toggleOption(key, tier)}
            aria-pressed={checked}
            aria-disabled={locked}
            data-tier={tier}
          >
            <div className={styles.header}>
              <span className={styles.emoji}>{emoji}</span>
              <span className={styles.label}>{label}</span>
              {tier !== "free" && (
                <span className={styles.badge}>{tier.toUpperCase()}</span>
              )}
            </div>
            <p className={styles.desc}>{description}</p>
          </button>
        );
      })}
    </div>
  );
};
