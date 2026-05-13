import { Component, computed, inject } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { CertificacionService } from '../../../core/services/certificacion.service';
import { EmpleadoService } from '../../../core/services/empleado.service';

@Component({
  selector: 'app-admin-certificaciones',
  imports: [],
  templateUrl: './admin-certificaciones.component.html',
  styleUrl: './admin-certificaciones.component.css',
})
export class AdminCertificacionesComponent {
  private readonly certificacionService = inject(CertificacionService);
  private readonly empleadoService = inject(EmpleadoService);
  private readonly auth = inject(AuthService);

  readonly certificaciones = computed(() =>
    this.certificacionService.byEmpresa(this.auth.user()!.empresaId!),
  );

  empleadoNombre(empleadoId: string): string {
    return this.empleadoService.getById(empleadoId)?.nombre ?? 'Desconocido';
  }

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
}
