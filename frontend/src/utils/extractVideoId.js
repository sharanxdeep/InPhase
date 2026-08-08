export function extractVideoId(input) {
  const trimmed = input.trim();

  // If it's already just an 11-char ID, use as-is
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1); // strip leading "/"
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
  } catch (e) {
    return null; // not a valid URL and not a raw ID
  }

  return null;
}