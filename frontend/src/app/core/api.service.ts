import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Message lisible à partir d'une erreur HTTP. */
export function messageErreur(e: any): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Serveur injoignable. Vérifiez votre connexion.';
    if (e.status === 401) return 'Session expirée, reconnectez-vous.';
    const m = e.error && typeof e.error === 'object' ? e.error.message : null;
    return m || 'Erreur ' + e.status;
  }
  return (e && e.message) || 'Erreur inattendue';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private params(p?: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(p ?? {})) {
      if (v !== null && v !== undefined && v !== '') hp = hp.set(k, String(v));
    }
    return hp;
  }
  private wrap<T>(o: Observable<T>): Observable<T> {
    return o.pipe(catchError((e) => throwError(() => new Error(messageErreur(e)))));
  }

  get<T>(chemin: string, params?: Record<string, any>): Observable<T> {
    return this.wrap(this.http.get<T>('/api' + chemin, { params: this.params(params) }));
  }
  post<T>(chemin: string, corps?: any): Observable<T> {
    return this.wrap(this.http.post<T>('/api' + chemin, corps ?? {}));
  }
  put<T>(chemin: string, corps?: any): Observable<T> {
    return this.wrap(this.http.put<T>('/api' + chemin, corps ?? {}));
  }
  delete<T>(chemin: string): Observable<T> {
    return this.wrap(this.http.delete<T>('/api' + chemin));
  }
  blob(chemin: string): Observable<Blob> {
    return this.wrap(this.http.get('/api' + chemin, { responseType: 'blob' }));
  }

  /** Ouvre la facture PDF dans un nouvel onglet (téléchargement si le navigateur bloque). */
  ouvrirFacture(idCommande: number, erreur: (m: string) => void): void {
    const fenetre = window.open('', '_blank');
    this.blob(`/commandes/${idCommande}/facture`).subscribe({
      next: (b) => {
        const url = URL.createObjectURL(new Blob([b], { type: 'application/pdf' }));
        if (fenetre) {
          fenetre.location.href = url;
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `facture-${idCommande}.pdf`;
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (e) => { fenetre?.close(); erreur(e.message); },
    });
  }
}
