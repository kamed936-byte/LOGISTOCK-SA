import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';
import { Categorie, ROLE_ADMIN, ROLE_STOCK } from '../core/models';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="page-head"><h1>Catégories</h1>
      @if (edition) { <button class="btn accent" (click)="ouvrir(null)">+ Nouvelle catégorie</button> }</div>
    <div class="table-wrap">
      @if (liste.length) {
        <table><thead><tr><th>Nom</th><th class="num">Produits</th>@if (edition) {<th></th>}</tr></thead>
          <tbody>
            @for (c of liste; track c.id) {
              <tr><td>{{ c.nom }}</td><td class="num">{{ c.nbProduits }}</td>
                @if (edition) {
                  <td class="actions"><button class="btn small" (click)="ouvrir(c)">Renommer</button>
                    <button class="btn small danger" (click)="supprimer(c)">Supprimer</button></td>
                }
              </tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucune catégorie.</div> }
    </div>
    @if (modal) {
      <app-modal [titre]="courant ? 'Renommer la catégorie' : 'Nouvelle catégorie'" (fermer)="modal = false">
        <form (ngSubmit)="enregistrer()">
          <label>Nom de la catégorie</label><input name="nom" maxlength="80" required [(ngModel)]="nom">
          <p class="error">{{ erreur }}</p>
          <div class="actions"><button type="button" class="btn ghost" (click)="modal = false">Annuler</button><button type="submit" class="btn accent">Enregistrer</button></div>
        </form>
      </app-modal>
    }
  `,
})
export class CategoriesComponent implements OnInit {
  liste: Categorie[] = [];
  edition = false;
  modal = false;
  courant: Categorie | null = null;
  nom = '';
  erreur = '';
  constructor(private api: ApiService, session: SessionService, private toast: ToastService) {
    this.edition = session.aRole(ROLE_ADMIN, ROLE_STOCK);
  }
  ngOnInit(): void { this.charger(); }
  charger(): void {
    this.api.get<Categorie[]>('/categories').subscribe({ next: (l) => (this.liste = l), error: (e) => this.toast.afficher(e.message, true) });
  }
  ouvrir(c: Categorie | null): void { this.courant = c; this.nom = c?.nom ?? ''; this.erreur = ''; this.modal = true; }
  enregistrer(): void {
    const corps = { nom: this.nom };
    const appel = this.courant ? this.api.put('/categories/' + this.courant.id, corps) : this.api.post('/categories', corps);
    appel.subscribe({
      next: () => { this.toast.afficher(this.courant ? 'Catégorie modifiée' : 'Catégorie créée'); this.modal = false; this.charger(); },
      error: (e) => (this.erreur = e.message),
    });
  }
  supprimer(c: Categorie): void {
    if (!confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;
    this.api.delete('/categories/' + c.id).subscribe({
      next: () => { this.toast.afficher('Catégorie supprimée'); this.charger(); },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
}
