const memoryCategories = [
  "personal",
  "preference",
  "business",
  "project",
  "general",
];

const detectMemorySuggestion = (message) => {
  if (!message || typeof message !== "string") {
    return null;
  }

  const content = message.trim();

  if (content.length < 10 || content.length > 500) {
    return null;
  }

  const patterns = [
    /\bmy name is\b/i,
    /\bi prefer\b/i,
    /\bi like\b/i,
    /\bi dislike\b/i,
    /\bi work as\b/i,
    /\bi am building\b/i,
    /\bmy business\b/i,
    /\bmy goal is\b/i,
    /\bi always\b/i,
    /\bi usually\b/i,
  ];

  const matched = patterns.some((pattern) => pattern.test(content));

  if (!matched) {
    return null;
  }

  let category = "general";

  if (/\bmy name is\b/i.test(content)) {
    category = "personal";
  } else if (/\bi prefer\b|\bi like\b|\bi dislike\b/i.test(content)) {
    category = "preference";
  } else if (/\bi am building\b|\bmy business\b/i.test(content)) {
    category = "business";
  } else if (/\bmy goal is\b/i.test(content)) {
    category = "personal";
  }

  return {
    content,
    category: memoryCategories.includes(category) ? category : "general",
    importance: 7,
  };
};

export { detectMemorySuggestion };