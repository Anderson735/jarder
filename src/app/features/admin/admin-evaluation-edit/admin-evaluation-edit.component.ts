import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { CourseEvaluation, EvaluationQuestion } from '../../../core/models/app.models';
import { CourseService } from '../../../core/services/course.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-evaluation-edit',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './admin-evaluation-edit.component.html',
  styleUrl: './admin-evaluation-edit.component.css',
})
export class AdminEvaluationEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courses = inject(CourseService);

  readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), { initialValue: null });

  draft: CourseEvaluation | null = null;
  isNew = false;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(() => this.loadDraft());
  }

  private loadDraft(): void {
    const cid = this.route.snapshot.paramMap.get('courseId');
    const eid = this.route.snapshot.paramMap.get('evaluationId');
    if (!cid || !eid) {
      this.draft = null;
      return;
    }
    this.isNew = eid === 'new';
    if (this.isNew) {
      this.draft = this.emptyEvaluation(cid);
      return;
    }
    const existing = this.courses.getEvaluation(cid, eid);
    this.draft = existing
      ? structuredClone(existing)
      : this.emptyEvaluation(cid);
  }

  private emptyEvaluation(courseId: string): CourseEvaluation {
    return {
      id: '',
      courseId,
      title: '',
      description: '',
      passingScorePercent: 70,
      questions: [this.newQuestion()],
    };
  }

  private newQuestion(): EvaluationQuestion {
    return {
      id: crypto.randomUUID(),
      prompt: '',
      choices: ['', '', '', ''],
      correctIndex: 0,
    };
  }

  addQuestion(): void {
    if (!this.draft) {
      return;
    }
    this.draft.questions = [...this.draft.questions, this.newQuestion()];
  }

  removeQuestion(q: EvaluationQuestion): void {
    if (!this.draft || this.draft.questions.length <= 1) {
      return;
    }
    this.draft.questions = this.draft.questions.filter((x) => x.id !== q.id);
  }

  save(): void {
    if (!this.draft) {
      return;
    }
    const title = this.draft.title.trim();
    if (!title) {
      alert('Indica un título para la evaluación.');
      return;
    }
    if (this.draft.passingScorePercent < 0 || this.draft.passingScorePercent > 100) {
      alert('La nota mínima debe estar entre 0 y 100.');
      return;
    }
    for (const q of this.draft.questions) {
      if (!q.prompt.trim()) {
        alert('Cada pregunta necesita un enunciado.');
        return;
      }
      if (q.choices.some((c) => !c.trim())) {
        alert('Completa las cuatro opciones de cada pregunta.');
        return;
      }
    }
    const id = this.draft.id || crypto.randomUUID();
    const toSave: CourseEvaluation = {
      ...this.draft,
      id,
      courseId: this.draft.courseId,
      title,
      description: this.draft.description.trim(),
      questions: this.draft.questions.map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        choices: q.choices.map((c) => c.trim()) as [string, string, string, string],
      })),
    };
    this.courses.upsertEvaluation(toSave.courseId, toSave);
    if (this.isNew) {
      void this.router.navigate(['/admin/courses', toSave.courseId, 'evaluations', toSave.id], {
        replaceUrl: true,
      });
      this.isNew = false;
    }
    this.draft = structuredClone(toSave);
  }

  removeEvaluation(): void {
    if (!this.draft?.id || this.isNew) {
      return;
    }
    if (!confirm('¿Eliminar esta evaluación?')) {
      return;
    }
    this.courses.deleteEvaluation(this.draft.courseId, this.draft.id);
    void this.router.navigate(['/admin/courses', this.draft.courseId]);
  }

  courseTitle(): string {
    const cid = this.courseId();
    return cid ? (this.courses.getById(cid)?.title ?? 'Curso') : '';
  }
}
