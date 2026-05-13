import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const STORAGE_KEY = 'jarder_eval_results_v1';

export interface EvaluationAttemptRecord {
  evaluationId: string;
  courseId: string;
  userId: string;
  userDisplayName: string;
  courseTitle: string;
  evaluationTitle: string;
  passed: boolean;
  scorePercent: number;
  completedAt: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationResultService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly revision = signal(0);

  private readAll(): Record<string, EvaluationAttemptRecord> {
    if (!isPlatformBrowser(this.platformId)) {
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, EvaluationAttemptRecord>;
    } catch {
      return {};
    }
  }

  private writeAll(data: Record<string, EvaluationAttemptRecord>): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private makeKey(userId: string, courseId: string, evaluationId: string): string {
    return `${userId}::${courseId}::${evaluationId}`;
  }

  get(userId: string, courseId: string, evaluationId: string): EvaluationAttemptRecord | undefined {
    this.revision();
    if (!isPlatformBrowser(this.platformId)) {
      return undefined;
    }
    return this.readAll()[this.makeKey(userId, courseId, evaluationId)];
  }

  /** Último intento guardado (sirve para certificado si aprobó). */
  save(record: EvaluationAttemptRecord): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const all = this.readAll();
    all[this.makeKey(record.userId, record.courseId, record.evaluationId)] = record;
    this.writeAll(all);
    this.revision.update((n) => n + 1);
  }

  hasPassed(userId: string, courseId: string, evaluationId: string): boolean {
    const r = this.get(userId, courseId, evaluationId);
    return !!r?.passed;
  }
}
