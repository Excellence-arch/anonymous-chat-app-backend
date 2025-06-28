import type { Request, Response, NextFunction } from "express"

const BLOCKED_PATTERNS = [
  // Email patterns
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone number patterns
  /(\+?\d{1,4}[\s-]?)?(\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}/g,

  /(\+?\d{1,4}[\s-]?)?\d{10,}/g,
  // Social media handles
  /@[A-Za-z0-9_]+/g,
  // Introduction patterns
  /\b(my name is|i am|i'm|call me|contact me)\b/gi,
  // Contact-related words
  /\b(whatsapp|telegram|instagram|facebook|twitter|snapchat|discord|skype)\b/gi,
  // URL patterns
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
];

const INTRODUCTION_KEYWORDS = [
  "my name",
  "i am",
  "i'm",
  "call me",
  "contact me",
  "reach me",
  "find me",
  "add me",
  "follow me",
  "dm me",
  "text me",
]

export const contentFilter = (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Invalid message content" });
    return;
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      res.status(400).json({
        error: "Message contains prohibited content (contact information or personal details)",
      });
      return;
    }
  }

  // Check for introduction keywords
  const lowerContent = content.toLowerCase()
  for (const keyword of INTRODUCTION_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      res.status(400).json({
        error: "Messages containing personal introductions are not allowed",
      })
      return;
    }
  }

  next()
}
