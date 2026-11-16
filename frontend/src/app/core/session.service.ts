import { Injectable } from '@angular/core';
import { Utilisateur } from './models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  get token(): string | null {
    try { return sessionStorage.getItem('token'); } catch { return null; }
  }
  get user(): Utilisateur | null {
    try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; }
  }
  get connecte(): boolean { return !!this.token; }
  get role(): string { return this.user?.role ?? ''; }

  enregistrer(token: string, user: Utilisateur): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  }
  effacer(): void {
    try { sessionStorage.clear(); } catch { /* ignore */ }
  }
  aRole(...roles: string[]): boolean { return roles.includes(this.role); }
}
