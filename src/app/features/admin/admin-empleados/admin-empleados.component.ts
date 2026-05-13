import { Component, computed, inject } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { EmpleadoService } from '../../../core/services/empleado.service';

@Component({
  selector: 'app-admin-empleados',
  imports: [],
  templateUrl: './admin-empleados.component.html',
  styleUrl: './admin-empleados.component.css',
})
export class AdminEmpleadosComponent {
  private readonly empleadoService = inject(EmpleadoService);
  private readonly auth = inject(AuthService);

  readonly empleados = computed(() =>
    this.empleadoService.byEmpresa(this.auth.user()!.empresaId!),
  );
}
