import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="page-head"><h1>Utilisateurs</h1><button class="btn accent" (click)="ouvrir('creer')">+ Nouvel utilisateur</button></div>
    <div class="table-wrap">
      @if (liste.length) {
        <table><thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (u of liste; track u.id) {
              <tr><td>{{ u.nom }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td>
                <td><span class="tag" [class.ok]="u.actif" [class.off]="!u.actif">{{ u.actif ? 'Actif' : 'Désactivé' }}</span></td>
                <td class="actions"><button class="btn small" (click)="ouvrir('modifier', u)">Modifier</button>
                  <button class="btn small" (click)="ouvrir('mdp', u)">Mot de passe</button></td></tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucun utilisateur.</div> }
    </div>

    @if (modal) {
      <app-modal [titre]="titre()" (fermer)="modal = ''">
        <form (ngSubmit)="enregistrer()">
          @if (modal !== 'mdp') {
            <label>Nom complet</label><input name="nom" maxlength="100" required [(ngModel)]="f.nom">
          }
          @if (modal === 'creer') {
            <label>Adresse e-mail</label><input name="email" type="email" maxlength="150" required [(ngModel)]="f.email">
          }
          @if (modal !== 'modifier') {
            <label>Mot de passe (8 caractères minimum)</label>
            <input name="motDePasse" type="password" minlength="8" maxlength="72" required autocomplete="new-password" [(ngModel)]="f.motDePasse">
          }
          @if (modal !== 'mdp') {
            <label>Rôle</label>
            <select name="idRole" [(ngModel)]="f.idRole">
              @for (r of roles; track r.id) { <option [ngValue]="r.id">{{ r.libelle }}</option> }
            </select>
          }
          @if (modal === 'modifier') {
            <label>Statut</label>
            <select name="actif" [(ngModel)]="f.actif"><option [ngValue]="true">Actif</option><option [ngValue]="false">Désactivé</option></select>
          }
          <p class="error">{{ erreur }}</p>
          <div class="actions"><button type="button" class="btn ghost" (click)="modal = ''">Annuler</button><button type="submit" class="btn accent">Enregistrer</button></div>
        </form>
      </app-modal>
    }
  `,
})
export class UtilisateursComponent implements OnInit {
  liste: any[] = [];
  roles: { id: number; libelle: string }[] = [];
  modal: '' | 'creer' | 'modifier' | 'mdp' = '';
  courant: any = null;
  f: any = {};
  erreur = '';
  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.api.get<any[]>('/roles').subscribe((r) => (this.roles = r));
    this.charger();
  }
  charger(): void {
    this.api.get<any[]>('/utilisateurs').subscribe({ next: (l) => (this.liste = l), error: (e) => this.toast.afficher(e.message, true) });
  }
  titre(): string {
    return this.modal === 'creer' ? 'Nouvel utilisateur' : this.modal === 'modifier' ? "Modifier l'utilisateur" : 'Nouveau mot de passe : ' + this.courant?.nom;
  }
  ouvrir(mode: 'creer' | 'modifier' | 'mdp', u?: any): void {
    this.courant = u ?? null; this.erreur = ''; this.modal = mode;
    const premier = this.roles[0]?.id;
    this.f = mode === 'creer' ? { nom: '', email: '', motDePasse: '', idRole: premier }
      : mode === 'modifier' ? { nom: u.nom, idRole: u.idRole, actif: u.actif }
      : { motDePasse: '' };
  }
  enregistrer(): void {
    let appel;
    let message = '';
    if (this.modal === 'creer') {
      appel = this.api.post('/utilisateurs', { nom: this.f.nom, email: this.f.email, motDePasse: this.f.motDePasse, idRole: Number(this.f.idRole) });
      message = 'Utilisateur créé';
    } else if (this.modal === 'modifier') {
      appel = this.api.put('/utilisateurs/' + this.courant.id, { nom: this.f.nom, idRole: Number(this.f.idRole), actif: !!this.f.actif });
      message = 'Utilisateur modifié';
    } else {
      appel = this.api.put('/utilisateurs/' + this.courant.id + '/mot-de-passe', { motDePasse: this.f.motDePasse });
      message = 'Mot de passe modifié';
    }
    appel.subscribe({
      next: () => { this.toast.afficher(message); this.modal = ''; this.charger(); },
      error: (e) => (this.erreur = e.message),
    });
  }
}
