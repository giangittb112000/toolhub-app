import { useEffect, useState } from "react";

export type AppFont = {
  name: string;
  family: string;
  url: string;
};

export const AVAILABLE_FONTS: AppFont[] = [
  {
    name: "Inter",
    family: "'Inter', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
  {
    name: "Roboto",
    family: "'Roboto', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap",
  },
  {
    name: "Outfit",
    family: "'Outfit', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
  },
  {
    name: "Plus Jakarta Sans",
    family: "'Plus Jakarta Sans', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
  {
    name: "JetBrains Mono",
    family: "'JetBrains Mono', monospace",
    url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap",
  },
];

export function useAppFont() {
  const [currentFont, setCurrentFont] = useState<AppFont>(() => {
    const saved = localStorage.getItem("toolhub-font");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_e) {
        return AVAILABLE_FONTS[0];
      }
    }
    return AVAILABLE_FONTS[0];
  });

  useEffect(() => {
    // Save to local storage
    localStorage.setItem("toolhub-font", JSON.stringify(currentFont));

    // Update or create the link tag
    let link = document.getElementById("app-font-link") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = "app-font-link";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = currentFont.url;

    // Apply to body
    document.body.style.fontFamily = currentFont.family;
  }, [currentFont]);

  return { currentFont, setCurrentFont, fonts: AVAILABLE_FONTS };
}
