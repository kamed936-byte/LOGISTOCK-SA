import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

export const connecteGuard: CanActivateFn = () => {
  const s = inject(SessionService);
  return s.connecte ? true : inject(Router).createUrlTree(['/connexion']);
};

/** Accès réservé à certains rôles ; sinon retour au tableau de bord. */
export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const s = inject(SessionService);
  if (!s.connecte) return inject(Router).createUrlTree(['/connexion']);
  return s.aRole(...roles) ? true : inject(Router).createUrlTree(['/tableau']);
};
