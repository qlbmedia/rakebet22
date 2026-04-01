// Preload all case cover images so they're instantly available
const caseImageModules = import.meta.glob("@/assets/mm2-cases/*.webp", { eager: true, import: "default" }) as Record<string, string>;
const itemImageModules = import.meta.glob("@/assets/mm2-items/*.png", { eager: false }) as Record<string, () => Promise<{ default: string }>>;

export function preloadCaseImages(): Promise<void[]> {
  const urls = Object.values(caseImageModules);
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't block on errors
          img.src = src;
        })
    )
  );
}

// Lazily preload item images in the background (lower priority)
export function preloadItemImagesInBackground(): void {
  // Use requestIdleCallback to avoid blocking the main thread
  const load = () => {
    const entries = Object.values(itemImageModules);
    let i = 0;
    const loadNext = () => {
      if (i >= entries.length) return;
      entries[i]().then((mod) => {
        const img = new Image();
        img.src = mod.default;
        i++;
        // Load next after a small delay to avoid overwhelming
        setTimeout(loadNext, 50);
      }).catch(() => {
        i++;
        setTimeout(loadNext, 50);
      });
    };
    loadNext();
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(load);
  } else {
    setTimeout(load, 1000);
  }
}
