/** Convierte enlaces de YouTube en URL de embed para iframe. */
export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) {
        return `https://www.youtube.com/embed/${v}`;
      }
      const m = u.pathname.match(/^\/embed\/([^/]+)/);
      if (m?.[1]) {
        return `https://www.youtube.com/embed/${m[1]}`;
      }
    }
  } catch {
    /* URL inválida */
  }
  return null;
}

export function isLikelyVideoFile(name: string): boolean {
  return /\.(mp4|webm|ogg|mov)$/i.test(name);
}

export function isLikelyPdf(name: string): boolean {
  return /\.pdf$/i.test(name);
}
