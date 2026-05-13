import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import type { UserRole } from '../models/app.models';
import { AuthService } from '../services/auth.service';

export function roleGuard(expected: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return true;
    }
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (auth.role() !== expected) {
      return router.createUrlTree([expected === 'admin' ? '/worker' : '/admin']);
    }
    return true;
  };
}
