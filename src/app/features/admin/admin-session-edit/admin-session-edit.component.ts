import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { CourseMaterial, CourseSession, MaterialKind } from '../../../core/models/app.models';
import { CourseService } from '../../../core/services/course.service';
import { MaterialBlobStorageService } from '../../../core/storage/material-blob-storage.service';
import { isLikelyPdf, isLikelyVideoFile } from '../../../core/utils/video-url';

@Component({
  selector: 'app-admin-session-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-session-edit.component.html',
  styleUrl: './admin-session-edit.component.css',
})
export class AdminSessionEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly courses = inject(CourseService);
  private readonly blobs = inject(MaterialBlobStorageService);

  readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), { initialValue: null });
  private readonly sessionId = toSignal(this.route.paramMap.pipe(map((p) => p.get('sessionId'))), {
    initialValue: null,
  });

  protected readonly session = computed(() => {
    const cid = this.courseId();
    const sid = this.sessionId();
    if (!cid || !sid) {
      return undefined;
    }
    const c = this.courses.getById(cid);
    return c?.sessions.find((s) => s.id === sid);
  });

  title = '';
  description = '';
  newKind: MaterialKind = 'video';
  newTitle = '';
  newUrl = '';
  private readonly pickedFile = signal<File | null>(null);

  constructor() {
    this.route.paramMap.subscribe(() => this.sync());
  }

  private sync(): void {
    const s = this.session();
    if (!s) {
      return;
    }
    this.title = s.title;
    this.description = s.description;
  }

  kindLabel(k: MaterialKind): string {
    return k === 'video' ? 'Vídeo' : k === 'document' ? 'Documento' : 'Enlace';
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.pickedFile.set(f);
    if (f && !this.newTitle.trim()) {
      this.newTitle = f.name.replace(/\.[^/.]+$/, '');
    }
  }

  async addMaterial(): Promise<void> {
    const cid = this.courseId();
    const sid = this.sessionId();
    if (!cid || !sid) {
      return;
    }
    const file = this.pickedFile();
    const title = this.newTitle.trim();
    if (!title) {
      alert('Indica un título para el material.');
      return;
    }

    if (file) {
      const blobId = crypto.randomUUID();
      await this.blobs.put(blobId, file);
      let kind: MaterialKind = this.newKind;
      if (isLikelyVideoFile(file.name)) {
        kind = 'video';
      } else if (isLikelyPdf(file.name)) {
        kind = 'document';
      }
      this.courses.addMaterial(cid, sid, { title, kind, blobId });
      this.resetNew();
      return;
    }

    const url = this.newUrl.trim();
    if (!url) {
      alert('Pega una URL o selecciona un archivo.');
      return;
    }
    this.courses.addMaterial(cid, sid, {
      title,
      kind: this.newKind,
      externalUrl: url,
    });
    this.resetNew();
  }

  private resetNew(): void {
    this.newTitle = '';
    this.newUrl = '';
    this.newKind = 'video';
    this.pickedFile.set(null);
  }

  saveSession(): void {
    const cid = this.courseId();
    const s = this.session();
    if (!cid || !s) {
      return;
    }
    const next: CourseSession = {
      ...s,
      title: this.title.trim() || s.title,
      description: this.description.trim(),
    };
    this.courses.updateSession(cid, next);
  }

  removeMaterial(id: string): void {
    const cid = this.courseId();
    const sid = this.sessionId();
    if (!cid || !sid) {
      return;
    }
    this.courses.removeMaterial(cid, sid, id);
  }
}
