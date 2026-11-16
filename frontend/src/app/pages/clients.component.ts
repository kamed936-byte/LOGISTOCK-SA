import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Client, Commande } from '../core/models';
import { dateFr, money } from '../core/format';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="page-head"><h1>Clients</h1><button class="btn accent" (click)="ouvrir(null)">Nouveau client</button></div>
    <div class="toolbar"><input type="search" placeholder="Rechercher (nom, e-mail, téléphone)" [(ngModel)]="q" (ngModelChange)="recherche()"></div>
    <div class="table-wrap">
      @if (clients.length) {
        <table><thead><tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Adresse</th><th class="num">Achats</th><th></th></tr></thead>
          <tbody>
            @for (c of clients; track c.id) {
              <tr><td>{{ c.nom }} {{ c.prenom }}</td><td>{{ c.email }}</td><td>{{ c.telephone }}</td><td>{{ c.adresse }}</td><td class="num">{{ c.nbAchats }}</td>
                <td class="actions">
                  <button class="btn small" (click)="historique(c)">Historique</button>
                  <button class="btn small" (click)="ouvrir(c)">Modifier</button>
                  <button class="btn small danger" (click)="supprimer(c)">Supprimer</button></td></tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucun client.</div> }
    </div>

    @if (modal) {
      <app-modal [titre]="courant ? 'Modifier le client' : 'Nouveau client'" (fermer)="modal = false">
        <form (ngSubmit)="enregistrer()">
          <label>Nom *</label><input name="nom" required maxlength="100" [(ngModel)]="f.nom">
          <label>Prénom</label><input name="prenom" maxlength="100" [(ngModel)]="f.prenom">
          <label>E-mail</label><input name="email" type="email" maxlength="150" [(ngModel)]="f.email">
          <label>Téléphone</label><input name="telephone" maxlength="30" [(ngModel)]="f.telephone">
          <label>Adresse</label><input name="adresse" maxlength="255" [(ngModel)]="f.adresse">
          <p class="error">{{ erreur }}</p>
          <div class="actions"><button type="button" class="btn ghost" (click)="modal = false">Annuler</button><button type="submit" class="btn accent">Enregistrer</button></div>
        </form>
      </app-modal>
    }
    @if (histo) {
      <app-modal [titre]="'Historique : ' + histo.nom + ' ' + (histo.prenom || '')" (fermer)="histo = null">
        <div class="table-wrap">
          @if (achats.length) {
            <table><thead><tr><th>Date</th><th>Facture</th><th class="num">Total</th><th></th></tr></thead>
              <tbody>
                @for (o of achats; track o.id) {
                  <tr><td>{{ d(o.dateCommande) }}</td><td>{{ o.numeroFacture }}</td><td class="num">{{ m(o.total) }}</td>
                    <td><button class="btn small" (click)="pdf(o.id)">Facture PDF</button></td></tr>
                }
              </tbody></table>
          } @else { <div class="empty">Aucun achat pour ce client.</div> }
        </div>
        <div class="actions"><button class="btn ghost" (click)="histo = null">Fermer</button></div>
      </app-modal>
    }
  `,
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  q = '';
  modal = false;
  courant: Client | null = null;
  f: any = {};
  erreur = '';
  histo: Client | null = null;
  achats: Commande[] = [];
  d = dateFr;
  m = money;
  private t: any;
  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.charger(); }
  charger(): void {
    this.api.get<Client[]>('/clients', { q: this.q.trim() }).subscribe({ next: (c) => (this.clients = c), error: (e) => this.toast.afficher(e.message, true) });
  }
  recherche(): void { clearTimeout(this.t); this.t = setTimeout(() => this.charger(), 250); }

  ouvrir(c: Client | null): void {
    this.courant = c;
    this.f = { nom: c?.nom ?? '', prenom: c?.prenom ?? '', email: c?.email ?? '', telephone: c?.telephone ?? '', adresse: c?.adresse ?? '' };
    this.erreur = ''; this.modal = true;
  }
  enregistrer(): void {
    const appel = this.courant ? this.api.put('/clients/' + this.courant.id, this.f) : this.api.post('/clients', this.f);
    appel.subscribe({
      next: () => { this.toast.afficher(this.courant ? 'Client modifié' : 'Client créé'); this.modal = false; this.charger(); },
      error: (e) => (this.erreur = e.message),
    });
  }
  supprimer(c: Client): void {
    if (!confirm(`Supprimer le client ${c.nom} ?`)) return;
    this.api.delete('/clients/' + c.id).subscribe({
      next: () => { this.toast.afficher('Client supprimé'); this.charger(); },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
  historique(c: Client): void {
    this.api.get<Commande[]>('/commandes', { statut: 'VALIDEE', client: c.id }).subscribe({
      next: (a) => { this.achats = a; this.histo = c; },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
  pdf(id: number): void { this.api.ouvrirFacture(id, (m) => this.toast.afficher(m, true)); }
}
