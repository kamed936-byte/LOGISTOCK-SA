import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';
import { Categorie, Produit, ROLE_ADMIN, ROLE_STOCK } from '../core/models';
import { money } from '../core/format';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="page-head"><h1>Produits</h1>
      @if (edition) { <button class="btn accent" (click)="nouveau()">+ Nouveau produit</button> }</div>
    <div class="toolbar">
      <input type="search" placeholder="Rechercher par référence ou désignation…" [(ngModel)]="q" (ngModelChange)="recherche()">
      <select [(ngModel)]="filtreCat" (ngModelChange)="charger()">
        <option value="">Toutes les catégories</option>
        @for (c of categories; track c.id) { <option [value]="c.id">{{ c.nom }}</option> }
      </select>
    </div>
    <div class="table-wrap">
      @if (produits.length) {
        <table><thead><tr><th>Référence</th><th>Désignation</th><th>Catégorie</th><th class="num">Prix</th><th class="num">Stock</th><th class="num">Seuil</th>@if (edition) {<th></th>}</tr></thead>
          <tbody>
            @for (p of produits; track p.id) {
              <tr><td>{{ p.reference }}</td><td>{{ p.designation }}</td><td>{{ p.categorie }}</td>
                <td class="num">{{ m(p.prix) }}</td>
                <td class="num">{{ p.quantiteStock }}
                  @if (p.enAlerte) { <span class="tag" [class.danger]="p.quantiteStock === 0" [class.warn]="p.quantiteStock !== 0">{{ p.quantiteStock === 0 ? 'Rupture' : 'Alerte' }}</span> }</td>
                <td class="num">{{ p.seuilAlerte }}</td>
                @if (edition) {
                  <td class="actions">
                    <button class="btn small" (click)="mouvement(p)">Mouvement</button>
                    <button class="btn small" (click)="modifier(p)">Modifier</button>
                    <button class="btn small danger" (click)="supprimer(p)">Supprimer</button>
                  </td>
                }
              </tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucun produit ne correspond.</div> }
    </div>

    @if (modal === 'produit') {
      <app-modal [titre]="courant ? 'Modifier le produit' : 'Nouveau produit'" (fermer)="fermer()">
        <form (ngSubmit)="enregistrer()">
          <label>Référence</label><input name="reference" maxlength="30" required [(ngModel)]="f.reference">
          <label>Désignation</label><input name="designation" maxlength="150" required [(ngModel)]="f.designation">
          <label>Catégorie</label>
          <select name="idCategorie" required [(ngModel)]="f.idCategorie">
            @for (c of categories; track c.id) { <option [ngValue]="c.id">{{ c.nom }}</option> }
          </select>
          <label>Prix unitaire</label><input name="prix" type="number" step="0.01" min="0" required [(ngModel)]="f.prix">
          <label>Seuil d'alerte</label><input name="seuilAlerte" type="number" min="0" required [(ngModel)]="f.seuilAlerte">
          <p class="error">{{ erreur }}</p>
          <div class="actions"><button type="button" class="btn ghost" (click)="fermer()">Annuler</button><button type="submit" class="btn accent">Enregistrer</button></div>
        </form>
      </app-modal>
    }
    @if (modal === 'mouvement' && courant) {
      <app-modal [titre]="'Mouvement de stock : ' + courant.designation" (fermer)="fermer()">
        <form (ngSubmit)="enregistrerMouvement()">
          <p class="muted">Stock actuel : <strong>{{ courant.quantiteStock }}</strong></p>
          <label>Type</label>
          <select name="type" [(ngModel)]="mv.type"><option value="ENTREE">Entrée</option><option value="SORTIE">Sortie</option></select>
          <label>Quantité</label><input name="quantite" type="number" min="1" required [(ngModel)]="mv.quantite">
          <p class="error">{{ erreur }}</p>
          <div class="actions"><button type="button" class="btn ghost" (click)="fermer()">Annuler</button><button type="submit" class="btn accent">Enregistrer</button></div>
        </form>
      </app-modal>
    }
  `,
})
export class ProduitsComponent implements OnInit {
  categories: Categorie[] = [];
  produits: Produit[] = [];
  q = '';
  filtreCat: string = '';
  edition = false;
  modal: '' | 'produit' | 'mouvement' = '';
  courant: Produit | null = null;
  f: any = {};
  mv: any = { type: 'ENTREE', quantite: 1 };
  erreur = '';
  m = money;
  private t: any;

  constructor(private api: ApiService, session: SessionService, private toast: ToastService) {
    this.edition = session.aRole(ROLE_ADMIN, ROLE_STOCK);
  }

  ngOnInit(): void {
    this.api.get<Categorie[]>('/categories').subscribe((c) => (this.categories = c));
    this.charger();
  }
  charger(): void {
    this.api.get<Produit[]>('/produits', { q: this.q.trim(), categorie: this.filtreCat }).subscribe({
      next: (p) => (this.produits = p), error: (e) => this.toast.afficher(e.message, true),
    });
  }
  recherche(): void { clearTimeout(this.t); this.t = setTimeout(() => this.charger(), 250); }

  nouveau(): void {
    if (!this.categories.length) { this.toast.afficher("Créez d'abord une catégorie.", true); return; }
    this.courant = null;
    this.f = { reference: '', designation: '', idCategorie: this.categories[0].id, prix: null, seuilAlerte: 0 };
    this.erreur = ''; this.modal = 'produit';
  }
  modifier(p: Produit): void {
    this.courant = p;
    this.f = { reference: p.reference, designation: p.designation, idCategorie: p.idCategorie, prix: p.prix, seuilAlerte: p.seuilAlerte };
    this.erreur = ''; this.modal = 'produit';
  }
  enregistrer(): void {
    const corps = { ...this.f, idCategorie: Number(this.f.idCategorie), prix: Number(this.f.prix), seuilAlerte: Number(this.f.seuilAlerte) };
    const appel = this.courant ? this.api.put('/produits/' + this.courant.id, corps) : this.api.post('/produits', corps);
    appel.subscribe({
      next: () => {
        this.toast.afficher(this.courant ? 'Produit modifié' : 'Produit créé (stock à 0 : ajoutez une entrée de stock)');
        this.fermer(); this.charger();
      },
      error: (e) => (this.erreur = e.message),
    });
  }
  supprimer(p: Produit): void {
    if (!confirm(`Supprimer le produit « ${p.designation} » ?`)) return;
    this.api.delete('/produits/' + p.id).subscribe({
      next: () => { this.toast.afficher('Produit supprimé'); this.charger(); },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
  mouvement(p: Produit): void {
    this.courant = p; this.mv = { type: 'ENTREE', quantite: 1 }; this.erreur = ''; this.modal = 'mouvement';
  }
  enregistrerMouvement(): void {
    if (!this.courant) return;
    this.api.post<{ quantiteStock: number }>('/mouvements', { idProduit: this.courant.id, type: this.mv.type, quantite: Number(this.mv.quantite) }).subscribe({
      next: (r) => { this.toast.afficher('Mouvement enregistré. Nouveau stock : ' + r.quantiteStock); this.fermer(); this.charger(); },
      error: (e) => (this.erreur = e.message),
    });
  }
  fermer(): void { this.modal = ''; this.courant = null; }
}
