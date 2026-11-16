import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';
import { SessionService } from './core/session.service';
import { ToastService } from './core/toast.service';
import { Alerte, ROLE_ADMIN, ROLE_COMMERCIAL, ROLE_STOCK } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (session.connecte && !surConnexion) {
      <header class="topbar">
        <div class="brand">LogiStock <span>SA</span></div>
        <nav class="nav">
          @for (m of menu(); track m.chemin) {
            <a [routerLink]="m.chemin" routerLinkActive="actif">{{ m.titre }}
              @if (m.chemin === '/alertes' && nbAlertes > 0) { <span class="badge">{{ nbAlertes }}</span> }
            </a>
          }
        </nav>
        <div class="user">
          <span>{{ session.user?.nom }} <em>{{ session.role }}</em></span>
          <button class="btn ghost-light small" (click)="deconnexion()">Déconnexion</button>
        </div>
      </header>
    }
    <main [class.plein]="surConnexion"><router-outlet /></main>
    @if (toast.visible) { <div id="toast" [class.erreur]="toast.erreur">{{ toast.message }}</div> }
  `,
})
export class AppComponent implements OnInit {
  nbAlertes = 0;
  constructor(public session: SessionService, public toast: ToastService, private router: Router, private api: ApiService) {}

  get surConnexion(): boolean { return this.router.url.startsWith('/connexion'); }

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      if (this.session.connecte && !this.surConnexion) this.majAlertes();
    });
  }

  private majAlertes(): void {
    this.api.get<Alerte[]>('/alertes').subscribe({ next: (a) => (this.nbAlertes = a.length), error: () => {} });
  }

  menu(): { chemin: string; titre: string }[] {
    const tout = [
      { chemin: '/tableau', titre: 'Tableau de bord', roles: [] as string[] },
      { chemin: '/produits', titre: 'Produits', roles: [] },
      { chemin: '/categories', titre: 'Catégories', roles: [] },
      { chemin: '/mouvements', titre: 'Mouvements', roles: [ROLE_ADMIN, ROLE_STOCK] },
      { chemin: '/clients', titre: 'Clients', roles: [ROLE_ADMIN, ROLE_COMMERCIAL] },
      { chemin: '/ventes', titre: 'Ventes', roles: [ROLE_ADMIN, ROLE_COMMERCIAL] },
      { chemin: '/alertes', titre: 'Alertes', roles: [] },
      { chemin: '/utilisateurs', titre: 'Utilisateurs', roles: [ROLE_ADMIN] },
    ];
    return tout.filter((m) => m.roles.length === 0 || this.session.aRole(...m.roles));
  }

  deconnexion(): void {
    this.session.effacer();
    this.nbAlertes = 0;
    this.router.navigateByUrl('/connexion');
  }
}
