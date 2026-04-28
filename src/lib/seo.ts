function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function generateSeoDescription(
  title: string,
  description: string,
  type: "maleri" | "smykke",
): Promise<string> {
  const fallback = truncateText(description || title, 155);
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Skriv en SEO meta description på dansk på max 155 tegn til dette ${type}: "${title}". Beskrivelse: "${description}". Svar KUN med meta description teksten — ingen forklaring.`,
          },
        ],
      }),
    });

    if (!response.ok) return fallback;
    const data = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };
    const generated = data.content?.[0]?.text?.trim() ?? "";
    return truncateText(generated || fallback, 155);
  } catch {
    return fallback;
  }
}

export function toMetaDescription(value: string | null | undefined, maxLength = 160): string {
  return truncateText(value ?? "", maxLength);
}
