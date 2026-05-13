import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { EvaluationQuestion } from '../../../core/models/app.models';
import { AuthService } from '../../../core/services/auth.service';
import { CertificacionService } from '../../../core/services/certificacion.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationResultService } from '../../../core/services/evaluation-result.service';

@Component({
  selector: 'app-worker-exam',
  imports: [FormsModule, RouterLink],
  templateUrl: './worker-exam.component.html',
  styleUrl: './worker-exam.component.css',
})
export class WorkerExamComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courses = inject(CourseService);
  private readonly auth = inject(AuthService);
  private readonly results = inject(EvaluationResultService);
  private readonly certificacion = inject(CertificacionService);

  private readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), {
    initialValue: null,
  });
  private readonly evaluationId = toSignal(this.route.paramMap.pipe(map((p) => p.get('evaluationId'))), {
    initialValue: null,
  });

  protected readonly course = computed(() => {
    const id = this.courseId();
    return id ? this.courses.getPublishedById(id) : undefined;
  });

  protected readonly evaluation = computed(() => {
    const cid = this.courseId();
    const eid = this.evaluationId();
    if (!cid || !eid) {
      return undefined;
    }
    return this.courses.getEvaluation(cid, eid);
  });

  readonly answers = signal<Record<string, number>>({});

  submitted = false;
  scorePercent = 0;
  passed = false;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(() => {
      this.submitted = false;
      this.scorePercent = 0;
      this.passed = false;
      this.answers.set({});
    });
  }

  setAnswer(q: EvaluationQuestion, optionIndex: number): void {
    this.answers.update((m) => ({ ...m, [q.id]: optionIndex }));
  }

  retry(): void {
    this.submitted = false;
    this.scorePercent = 0;
    this.passed = false;
    this.answers.set({});
  }

  selectedOption(q: EvaluationQuestion): number | undefined {
    return this.answers()[q.id];
  }

  submit(): void {
    const ev = this.evaluation();
    const c = this.course();
    const user = this.auth.user();
    if (!ev || !c || !user) {
      return;
    }
    if (ev.questions.length === 0) {
      alert('Esta evaluación no tiene preguntas.');
      return;
    }
    const ans = this.answers();
    for (const q of ev.questions) {
      if (ans[q.id] === undefined) {
        alert('Responde todas las preguntas antes de enviar.');
        return;
      }
    }
    let correct = 0;
    for (const q of ev.questions) {
      if (ans[q.id] === q.correctIndex) {
        correct += 1;
      }
    }
    this.scorePercent = Math.round((correct / ev.questions.length) * 100);
    this.passed = this.scorePercent >= ev.passingScorePercent;
    this.submitted = true;

    this.results.save({
      evaluationId: ev.id,
      courseId: c.id,
      userId: user.id,
      userDisplayName: user.displayName,
      courseTitle: c.title,
      evaluationTitle: ev.title,
      passed: this.passed,
      scorePercent: this.scorePercent,
      completedAt: new Date().toISOString(),
    });

    if (this.passed) {
      this.certificacion.issue({
        empleadoId: user.empleadoId ?? user.id,
        empresaId: user.empresaId!,
        nombre: c.title + ' — ' + ev.title,
        cursoId: c.id,
      });
    }
  }

  goCertificate(): void {
    const cid = this.courseId();
    const eid = this.evaluationId();
    if (!cid || !eid) {
      return;
    }
    void this.router.navigate(['/worker/learn', cid, 'certificado', eid]);
  }
}
