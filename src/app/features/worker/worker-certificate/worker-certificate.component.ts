import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { EvaluationResultService } from '../../../core/services/evaluation-result.service';

@Component({
  selector: 'app-worker-certificate',
  imports: [RouterLink],
  templateUrl: './worker-certificate.component.html',
  styleUrl: './worker-certificate.component.css',
})
export class WorkerCertificateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly results = inject(EvaluationResultService);

  private readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), {
    initialValue: null,
  });
  private readonly evaluationId = toSignal(this.route.paramMap.pipe(map((p) => p.get('evaluationId'))), {
    initialValue: null,
  });

  protected readonly record = computed(() => {
    const u = this.auth.user();
    const cid = this.courseId();
    const eid = this.evaluationId();
    if (!u || !cid || !eid) {
      return undefined;
    }
    return this.results.get(u.id, cid, eid);
  });

  protected readonly canShow = computed(() => {
    const r = this.record();
    return !!r?.passed;
  });

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  print(): void {
    globalThis.print?.();
  }
}
