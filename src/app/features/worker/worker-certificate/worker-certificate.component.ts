import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { Certificacion } from '../../../core/models/app.models';
import { AuthService } from '../../../core/services/auth.service';
import { CertificacionService } from '../../../core/services/certificacion.service';
import { EvaluationResultService } from '../../../core/services/evaluation-result.service';

@Component({
  selector: 'app-worker-certificate',
  imports: [RouterLink],
  templateUrl: './worker-certificate.component.html',
  styleUrl: './worker-certificate.component.css',
})
export class WorkerCertificateComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  private readonly results = inject(EvaluationResultService);
  private readonly certificacionService = inject(CertificacionService);

  protected readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), {
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

  protected readonly certificacion = computed<Certificacion | null>(() => {
    const u = this.auth.user();
    const cid = this.courseId();
    if (!u || !cid) return null;
    const list = this.certificacionService.byEmpleado(u.empleadoId ?? u.id);
    const filtered = list.filter((c) => c.cursoId === cid);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  });

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return iso;
    }
  }

  print(): void {
    globalThis.print?.();
  }
}
