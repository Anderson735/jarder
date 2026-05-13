import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'admin/**', renderMode: RenderMode.Server },
  { path: 'worker/**', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];
