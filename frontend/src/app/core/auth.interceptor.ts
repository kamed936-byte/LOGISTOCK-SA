import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from './session.service';

/** Ajoute le jeton JWT à chaque appel et renvoie vers la connexion si la session a expiré (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.token;
  const requete = token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;
  return next(requete).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {
        session.effacer();
        router.navigateByUrl('/connexion');
      }
      return throwError(() => err);
    })
  );
};
