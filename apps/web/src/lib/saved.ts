export type SavedItem = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  sourceName: string | null;
  canonicalUrl?: string | null;
  emailId?: string | null;
  savedAt: string;
  type: "story" | "radar";
};

const STORAGE_KEY = "signalos_saved_items";

export function getSavedItems(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

export function saveItem(item: Omit<SavedItem, "savedAt">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const items = getSavedItems();
    const existingIndex = items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      // Toggle off if already saved
      items.splice(existingIndex, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("signalos_saved_change"));
      return false;
    } else {
      // Add to top
      items.unshift({ ...item, savedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("signalos_saved_change"));
      return true;
    }
  } catch {
    return false;
  }
}

export function removeSavedItem(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const items = getSavedItems().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("signalos_saved_change"));
  } catch {}
}

export function isItemSaved(id: string): boolean {
  if (typeof window === "undefined") return false;
  const items = getSavedItems();
  return items.some((i) => i.id === id);
}

