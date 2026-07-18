// ─────────────────────────────────────────────────────────────────────────
// NEW FILE — shared image helpers
//
// Two problems this fixes:
//
// 1) Property photos and avatars were stored as full-resolution base64 data
//    URLs (a single ~8-10MB photo can become a ~13MB string). localStorage
//    has a hard ~5-10MB-per-origin quota, so a couple of full-size uploads
//    silently blew past it. `saveProperties`/`updateUser` would throw, the
//    save would fail, and the image (sometimes the whole listing) would
//    vanish or never appear on other pages after a refresh/navigation.
//    `compressImageFile` downsizes + re-encodes every upload client-side
//    before it's ever turned into a data URL, so a normal photo now stores
//    at a few hundred KB instead of several MB.
//
// 2) If an image URL ever does fail to load (a blocked/expired external
//    URL, a corrupted data URL, a deleted upload, etc.) the browser just
//    shows a broken-image icon. `handleImgError` swaps that out for a
//    clean placeholder graphic instead, so a bad image never looks like a
//    bug in the page.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Reads an image File, downscales it to fit within maxWidth x maxHeight
 * (preserving aspect ratio) and re-encodes it as a JPEG data URL at the
 * given quality. Falls back to a plain FileReader data URL if canvas
 * processing fails for any reason (e.g. unsupported file type).
 */
export function compressImageFile(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Couldn't read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result); // fall back to the raw data URL
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (_) {
          resolve(reader.result); // canvas unsupported/tainted — use the original
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Compress a whole FileList/array of Files in parallel. */
export function compressImageFiles(files, options) {
  return Promise.all(files.map((file) => compressImageFile(file, options)));
}

// Small inline SVG placeholder — no network request, always renders, works
// for both square property thumbnails and circular avatars.
export const IMAGE_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E" +
  "%3Crect width='400' height='300' fill='%23e2e8f0'/%3E" +
  "%3Cg fill='%2394a3b8'%3E" +
  "%3Cpath d='M150 120h100v70H150z' fill='none' stroke='%2394a3b8' stroke-width='6'/%3E" +
  "%3Ccircle cx='175' cy='145' r='8'/%3E" +
  "%3Cpath d='M150 175l30-25 25 20 20-15 25 20v15H150z'/%3E" +
  "%3C/g%3E%3C/svg%3E";

/** Drop-in onError handler: swaps a broken <img> for the placeholder graphic. */
export function handleImgError(e) {
  e.target.onerror = null; // prevent any error loop
  e.target.src = IMAGE_FALLBACK;
}
