import styles from './OutputSelector.module.css';

type OutputType =
  | 'caption'
  | 'hashtags'
  | 'bio'
  | 'dm'
  | 'comments'
  | 'story'
  | 'hook';

type Plan = 'free' | 'pro' | 'premium';

type OutputOption = {
  key: OutputType;
  label: string;
  description: string;
  emoji: string;
  tier: Plan;
};

const OPTIONS: OutputOption[] = [
  { key: 'caption', label: 'Captions', emoji: '📝', description: 'Stylové popisky k fotkám', tier: 'free' },
  { key: 'hashtags', label: 'Hashtagy', emoji: '#️⃣', description: 'Relevantní hashtagy', tier: 'pro' },
  { key: 'bio', label: 'Bio', emoji: '✍️', description: 'Profilový popis', tier: 'pro' },
  { key: 'comments', label: 'Komentáře', emoji: '💬', description: 'Komentáře pro růst', tier: 'pro' },
  { key: 'story', label: 'Story texty', emoji: '📲', description: 'Výzvy do stories', tier: 'pro' },
  { key: 'dm', label: 'DM zprávy', emoji: '💌', description: 'Flirty zprávy pro fanoušky', tier: 'premium' },
  { key: 'hook', label: 'Hooky / overlay', emoji: '🎯', description: 'Úderné začátky a texty přes video', tier: 'premium' },
];

type Props = {
  selected: OutputType[];
  onChange: (newSelected: OutputType[]) => void;
  userPlan: Plan;
};

export const OutputSelector = ({ selected, onChange, userPlan }: Props) => {
  const toggleOption = (key: OutputType, tier: Plan) => {
    const isAllowed =
      userPlan === 'premium' ||
      (userPlan === 'pro' && tier !== 'premium') ||
      (userPlan === 'free' && tier === 'free');

    if (!isAllowed) {
      alert('Tato funkce je dostupná pouze pro vyšší plán.');
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
        const isChecked = selected.includes(key);
        const isDisabled =
          (tier === 'pro' && userPlan === 'free') || (tier === 'premium' && userPlan !== 'premium');

        return (
          <div
            key={key}
            className={`${styles.card} ${isChecked ? styles.checked : ''} ${isDisabled ? styles.disabled : ''}`}
            onClick={() => toggleOption(key, tier)}
          >
            <div className={styles.header}>
              <span className={styles.emoji}>{emoji}</span>
              <span className={styles.label}>{label}</span>
              {tier !== 'free' && <span className={styles.tier}>{tier.toUpperCase()}</span>}
            </div>
            <p className={styles.desc}>{description}</p>
          </div>
        );
      })}
    </div>
  );
};
