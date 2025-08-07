// src/constants/outputMeta.ts

export const outputMeta: Record<
  string,
  {
    emoji: string;
    color: string;
    description: string;
    tooltip: string;
  }
> = {
  caption: {
    emoji: "📝",
    color: "#8B5CF6",
    description: "Post caption for Instagram, TikTok, OnlyFans or X",
    tooltip: "Catchy text for your post – designed to grab attention and match your vibe.",
  },
  hashtags: {
    emoji: "#️⃣",
    color: "#10B981",
    description: "Suggested hashtags to improve reach",
    tooltip: "A set of hashtags tailored to increase reach and relevance on your platform.",
  },
  bio: {
    emoji: "✍️",
    color: "#F59E0B",
    description: "Short bio text for your profile",
    tooltip: "Your profile text – make a strong first impression with a short, unique bio.",
  },
  dm: {
    emoji: "💌",
    color: "#EC4899",
    description: "Message you can send to your fans or followers",
    tooltip: "Private message to start conversations – flirty, friendly, or bold.",
  },
  comments: {
    emoji: "💬",
    color: "#3B82F6",
    description: "Replies or comments under posts",
    tooltip: "Suggested replies or comments you can post under content.",
  },
  story: {
    emoji: "📲",
    color: "#6366F1",
    description: "Text for Instagram or TikTok stories",
    tooltip: "Text for your Instagram or TikTok stories – short, punchy and timely.",
  },
  hook: {
    emoji: "🎯",
    color: "#EF4444",
    description: "First line that grabs attention",
    tooltip: "The first line that grabs attention and keeps your audience reading.",
  },
};