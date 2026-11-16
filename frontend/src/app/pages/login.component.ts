import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <form class="login-card" (ngSubmit)="connecter()">
        <h1>LogiStock <span>SA</span></h1>
        <p class="sub">Connectez-vous pour accéder à l'application.</p>
        <label for="email">Adresse e-mail</label>
        <input id="email" name="email" type="email" autocomplete="username" required [(ngModel)]="email">
        <label for="mdp">Mot de passe</label>
        <input id="mdp" name="motDePasse" type="password" autocomplete="current-password" required [(ngModel)]="mdp">
        <p class="error">{{ erreur }}</p>
        <button class="btn accent block" type="submit" [disabled]="charge">Se connecter</button>
      </form>
    </div>`,
})
export class LoginComponent {
  email = '';
  mdp = '';
  erreur = '';
  charge = false;
  constructor(private api: ApiService, private session: SessionService, private router: Router) {}

  connecter(): void {
    this.erreur = '';
    this.charge = true;
    this.api.post<any>('/auth/login', { email: this.email, motDePasse: this.mdp }).subscribe({
      next: (r) => { this.session.enregistrer(r.token, r.utilisateur); this.router.navigateByUrl('/tableau'); },
      error: (e) => { this.erreur = e.message; this.charge = false; },
    });
  }
}
