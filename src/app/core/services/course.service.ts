import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { Course, CourseEvaluation, CourseMaterial, CourseSession } from '../models/app.models';
import { MaterialBlobStorageService } from '../storage/material-blob-storage.service';

const STORAGE_KEY = 'jarder_courses_v1';

function nowIso(): string {
  return new Date().toISOString();
}

function sortSessions(sessions: CourseSession[]): CourseSession[] {
  return [...sessions].sort((a, b) => a.order - b.order);
}

function ensureCourseShape(c: Course): Course {
  return {
    ...c,
    sessions: Array.isArray(c.sessions) ? c.sessions : [],
    evaluations: Array.isArray(c.evaluations) ? c.evaluations : [],
  };
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly blobs = inject(MaterialBlobStorageService);

  private readonly coursesSignal = signal<Course[]>([]);

  /** Cursos publicados (catálogo trabajador) */
  readonly publishedCourses = computed(() =>
    this.coursesSignal()
      .filter((c) => c.published)
      .map((c) => {
        const n = ensureCourseShape(c);
        return { ...n, sessions: sortSessions(n.sessions) };
      }),
  );

  /** Todos los cursos (panel admin) */
  readonly allCourses = computed(() =>
    this.coursesSignal().map((c) => {
      const n = ensureCourseShape(c);
      return { ...n, sessions: sortSessions(n.sessions) };
    }),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Course[];
      const list = Array.isArray(parsed) ? parsed.map((c) => ensureCourseShape(c)) : [];
      this.coursesSignal.set(list);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.coursesSignal()));
  }

  getById(id: string): Course | undefined {
    const c = this.coursesSignal().find((x) => x.id === id);
    if (!c) {
      return undefined;
    }
    const n = ensureCourseShape(c);
    return { ...n, sessions: sortSessions(n.sessions) };
  }

  getPublishedById(id: string): Course | undefined {
    const c = this.getById(id);
    return c?.published ? c : undefined;
  }

  upsertCourse(partial: Partial<Course> & Pick<Course, 'title'>): Course {
    const list = this.coursesSignal();
    const ts = nowIso();
    let next: Course[];
    if (partial.id) {
      next = list.map((c) => {
        if (c.id !== partial.id) {
          return ensureCourseShape(c);
        }
        const base = ensureCourseShape(c);
        return {
          ...base,
          ...partial,
          sessions: partial.sessions ?? base.sessions,
          evaluations: partial.evaluations ?? base.evaluations,
          updatedAt: ts,
        };
      });
    } else {
      const course: Course = {
        id: crypto.randomUUID(),
        title: partial.title,
        description: partial.description ?? '',
        thumbnailUrl: partial.thumbnailUrl,
        published: partial.published ?? false,
        createdAt: ts,
        updatedAt: ts,
        sessions: partial.sessions ?? [],
        evaluations: partial.evaluations ?? [],
      };
      next = [...list, course];
    }
    this.coursesSignal.set(next);
    this.persist();
    return this.getById(partial.id ?? next[next.length - 1].id)!;
  }

  deleteCourse(id: string): void {
    const course = this.getById(id);
    if (!course) {
      return;
    }
    for (const s of course.sessions) {
      for (const m of s.materials) {
        if (m.blobId) {
          void this.blobs.delete(m.blobId);
        }
      }
    }
    this.coursesSignal.set(this.coursesSignal().filter((c) => c.id !== id));
    this.persist();
  }

  addSession(courseId: string, title: string): CourseSession | undefined {
    const course = this.getById(courseId);
    if (!course) {
      return undefined;
    }
    const order =
      course.sessions.length === 0 ? 0 : Math.max(...course.sessions.map((s) => s.order)) + 1;
    const session: CourseSession = {
      id: crypto.randomUUID(),
      courseId,
      title,
      description: '',
      order,
      materials: [],
    };
    this.upsertCourse({
      ...course,
      sessions: [...course.sessions, session],
    });
    return session;
  }

  updateSession(courseId: string, session: CourseSession): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    const sessions = course.sessions.map((s) => (s.id === session.id ? { ...session } : s));
    this.upsertCourse({ ...course, sessions });
  }

  deleteSession(courseId: string, sessionId: string): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    const session = course.sessions.find((s) => s.id === sessionId);
    if (session) {
      for (const m of session.materials) {
        if (m.blobId) {
          void this.blobs.delete(m.blobId);
        }
      }
    }
    this.upsertCourse({
      ...course,
      sessions: course.sessions.filter((s) => s.id !== sessionId),
    });
  }

  addMaterial(courseId: string, sessionId: string, material: Omit<CourseMaterial, 'id'>): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    const sessions = course.sessions.map((s) => {
      if (s.id !== sessionId) {
        return s;
      }
      const m: CourseMaterial = { ...material, id: crypto.randomUUID() };
      return { ...s, materials: [...s.materials, m] };
    });
    this.upsertCourse({ ...course, sessions });
  }

  removeMaterial(courseId: string, sessionId: string, materialId: string): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    const sessions = course.sessions.map((s) => {
      if (s.id !== sessionId) {
        return s;
      }
      const mat = s.materials.find((m) => m.id === materialId);
      if (mat?.blobId) {
        void this.blobs.delete(mat.blobId);
      }
      return { ...s, materials: s.materials.filter((m) => m.id !== materialId) };
    });
    this.upsertCourse({ ...course, sessions });
  }

  reorderSessions(courseId: string, orderedSessionIds: string[]): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    const map = new Map(course.sessions.map((s) => [s.id, s] as const));
    const sessions = orderedSessionIds
      .map((id, idx) => {
        const s = map.get(id);
        return s ? { ...s, order: idx } : null;
      })
      .filter((x): x is CourseSession => x !== null);
    this.upsertCourse({ ...course, sessions });
  }

  getEvaluation(courseId: string, evaluationId: string): CourseEvaluation | undefined {
    const c = this.getById(courseId);
    return c?.evaluations.find((e) => e.id === evaluationId);
  }

  upsertEvaluation(courseId: string, evaluation: CourseEvaluation): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    const list = [...course.evaluations];
    const idx = list.findIndex((e) => e.id === evaluation.id);
    if (idx >= 0) {
      list[idx] = evaluation;
    } else {
      list.push(evaluation);
    }
    this.upsertCourse({ ...course, evaluations: list });
  }

  deleteEvaluation(courseId: string, evaluationId: string): void {
    const course = this.getById(courseId);
    if (!course) {
      return;
    }
    this.upsertCourse({
      ...course,
      evaluations: course.evaluations.filter((e) => e.id !== evaluationId),
    });
  }
}
