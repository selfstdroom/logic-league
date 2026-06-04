export function formatDateTime(value: string | null) {
  if (!value) return "未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function createPreview(content: string, maxLength = 140) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength)}…`;
}


export function formatAnswerType(value: string | null | undefined) {
  switch (value) {
    case "Counter":
      return "反論";
    case "Support":
      return "賛成・補足";
    case "Question":
      return "質問";
    case "Answer":
      return "回答";
    default:
      return "回答";
  }
}

export function formatReplyType(value: string | null | undefined) {
  switch (value) {
    case "counter":
      return "反論";
    case "rebuttal":
      return "再反論";
    case "support":
      return "補足";
    case "question":
      return "質問";
    default:
      return "補足";
  }
}

export function formatDiscussionType(value: string | null | undefined) {
  switch (value) {
    case "weekly":
      return "Competitive";
    case "special":
      return "Special";
    default:
      return "Daily";
  }
}

export function formatTopicCategory(value: string | null | undefined) {
  switch (value) {
    case "AI":
      return "AI";
    case "Business":
      return "ビジネス";
    case "Economics":
      return "経済";
    case "Society":
      return "社会";
    case "Psychology":
      return "心理";
    case "Science":
      return "科学";
    default:
      return value ?? "議論";
  }
}
