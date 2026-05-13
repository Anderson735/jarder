import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { CourseMaterial, CourseSession } from '../../../core/models/app.models';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationResultService } from '../../../core/services/evaluation-result.service';
import { ProgressService } from '../../../core/services/progress.service';
import { MaterialBlobStorageService } from '../../../core/storage/material-blob-storage.service';
import { youtubeEmbedUrl } from '../../../core/utils/video-url';

@Component({
  selector: 'app-worker-learn',
  imports: [RouterLink],
  templateUrl: './worker-learn.component.html',
  styleUrl: './worker-learn.component.css',
})
export class WorkerLearnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly courses = inject(CourseService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);
  protected readonly evalResults = inject(EvaluationResultService);
  private readonly blobs = inject(MaterialBlobStorageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), {
    initialValue: null,
  });

  protected readonly course = computed(() => {
    const id = this.courseId();
    return id ? this.courses.getPublishedById(id) : undefined;
  });

  protected readonly activeId = signal<string | null>(null);

  protected readonly activeSession = computed(() => {
    const c = this.course();
    const id = this.activeId();
    if (!c || !id) {
      return undefined;
    }
    return c.sessions.find((s) => s.id === id);
  });

  private objectUrls = new Map<string, string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.activeId.set(null);
    });

    effect(() => {
      const c = this.course();
      if (!c?.sessions.length) {
        return;
      }
      const current = untracked(() => this.activeId());
      if (!current || !c.sessions.some((s) => s.id === current)) {
        this.activeId.set(c.sessions[0]!.id);
      }
      void this.warmBlobs(c.sessions);
    });

    this.destroyRef.onDestroy(() => this.revokeAll());
  }

  evalPassed(evaluationId: string): boolean {
    const u = this.auth.user();
    const c = this.course();
    if (!u || !c) {
      return false;
    }
    return this.evalResults.hasPassed(u.id, c.id, evaluationId);
  }

  private async warmBlobs(sessions: CourseSession[] | undefined): Promise<void> {
    this.revokeAll();
    if (!isPlatformBrowser(this.platformId) || !sessions) {
      return;
    }
    for (const s of sessions) {
      for (const m of s.materials) {
        if (!m.blobId) {
          continue;
        }
        const blob = await this.blobs.get(m.blobId);
        if (blob) {
          const url = URL.createObjectURL(blob);
          this.objectUrls.set(m.id, url);
        }
      }
    }
  }

  private revokeAll(): void {
    for (const u of this.objectUrls.values()) {
      URL.revokeObjectURL(u);
    }
    this.objectUrls.clear();
  }

  select(id: string): void {
    this.activeId.set(id);
  }

  toggleDone(sessionId: string): void {
    const c = this.course();
    if (!c) {
      return;
    }
    const cur = this.progress.isSessionDone(c.id, sessionId);
    this.progress.setSessionDone(c.id, sessionId, !cur);
  }

  embedUrl(m: CourseMaterial): SafeResourceUrl | null {
    const u = m.externalUrl;
    if (!u) {
      return null;
    }
    const y = youtubeEmbedUrl(u);
    if (!y) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(y);
  }

  videoObjectUrl(m: CourseMaterial): string | null {
    if (m.externalUrl && !youtubeEmbedUrl(m.externalUrl)) {
      return m.externalUrl;
    }
    const o = this.objectUrls.get(m.id);
    if (m.kind === 'video' && o) {
      return o;
    }
    return null;
  }

  docObjectUrl(m: CourseMaterial): SafeResourceUrl | null {
    const o = this.objectUrls.get(m.id);
    if (m.kind === 'document' && o) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(o);
    }
    return null;
  }
}
