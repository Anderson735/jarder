import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const prefix = 'jarder_progress_';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  /** Invalida lecturas en plantillas al guardar progreso. */
  private readonly revision = signal(0);

  isSessionDone(courseId: string, sessionId: string): boolean {
    this.revision();
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const map = this.read(courseId);
    return !!map[sessionId];
  }

  setSessionDone(courseId: string, sessionId: string, done: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const map = this.read(courseId);
    if (done) {
      map[sessionId] = true;
    } else {
      delete map[sessionId];
    }
    localStorage.setItem(prefix + courseId, JSON.stringify(map));
    this.revision.update((n) => n + 1);
  }

  private read(courseId: string): Record<string, boolean> {
    const raw = localStorage.getItem(prefix + courseId);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  }
}
