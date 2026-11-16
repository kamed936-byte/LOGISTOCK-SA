import { Routes } from '@angular/router';
import { connecteGuard, roleGuard } from './core/guards';
import { ROLE_ADMIN, ROLE_COMMERCIAL, ROLE_STOCK } from './core/models';
import { LoginComponent } from './pages/login.component';
import { TableauComponent } from './pages/tableau.component';
import { ProduitsComponent } from './pages/produits.component';
import { CategoriesComponent } from './pages/categories.component';
import { MouvementsComponent } from './pages/mouvements.component';
import { AlertesComponent } from './pages/alertes.component';
import { UtilisateursComponent } from './pages/utilisateurs.component';
import { ClientsComponent } from './pages/clients.component';
import { VentesComponent } from './pages/ventes.component';
import { VenteEditeurComponent } from './pages/vente-editeur.component';

export const routes: Routes = [
  { path: 'connexion', component: LoginComponent },
  { path: 'tableau', component: TableauComponent, canActivate: [connecteGuard] },
  { path: 'produits', component: ProduitsComponent, canActivate: [connecteGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [connecteGuard] },
  { path: 'mouvements', component: MouvementsComponent, canActivate: [roleGuard(ROLE_ADMIN, ROLE_STOCK)] },
  { path: 'alertes', component: AlertesComponent, canActivate: [connecteGuard] },
  { path: 'clients', component: ClientsComponent, canActivate: [roleGuard(ROLE_ADMIN, ROLE_COMMERCIAL)] },
  { path: 'ventes', component: VentesComponent, canActivate: [roleGuard(ROLE_ADMIN, ROLE_COMMERCIAL)] },
  { path: 'ventes/nouvelle', component: VenteEditeurComponent, canActivate: [roleGuard(ROLE_ADMIN, ROLE_COMMERCIAL)] },
  { path: 'ventes/:id', component: VenteEditeurComponent, canActivate: [roleGuard(ROLE_ADMIN, ROLE_COMMERCIAL)] },
  { path: 'utilisateurs', component: UtilisateursComponent, canActivate: [roleGuard(ROLE_ADMIN)] },
  { path: '', pathMatch: 'full', redirectTo: 'tableau' },
  { path: '**', redirectTo: 'tableau' },
];
