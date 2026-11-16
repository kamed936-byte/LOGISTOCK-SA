import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Mouvement, Produit } from '../core/models';
import { dateFr } from '../core/format';

@Component({
  selector: 'app-mouvements',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head"><h1>Mouvements de stock</h1></div>
    <form class="card inline-form" (ngSubmit)="enregistrer()">
      <div><label>Produit</label>
        <select name="idProduit" required [(ngModel)]="f.idProduit">
          @for (p of produits; track p.id) { <option [ngValue]="p.id">{{ p.designation }}</option> }
        </select></div>
      <div><label>Type</label><select name="type" [(ngModel)]="f.type"><option value="ENTREE">Entrée</option><option value="SORTIE">Sortie</option></select></div>
      <div><label>Quantité</label><input name="quantite" type="number" min="1" required [(ngModel)]="f.quantite"></div>
      <button class="btn accent" type="submit">Enregistrer</button>
    </form>
    <div class="toolbar">
      <select [(ngModel)]="fProduit" (ngModelChange)="charger()">
        <option value="">Tous les produits</option>
        @for (p of produits; track p.id) { <option [value]="p.id">{{ p.designation }}</option> }
      </select>
      <select [(ngModel)]="fType" (ngModelChange)="charger()">
        <option value="">Entrées et sorties</option><option value="ENTREE">Entrées</option><option value="SORTIE">Sorties</option>
      </select>
    </div>
    <div class="table-wrap">
      @if (rows.length) {
        <table><thead><tr><th>Date</th><th>Produit</th><th>Type</th><th class="num">Quantité</th><th>Auteur</th><th>Vente</th></tr></thead>
          <tbody>
            @for (r of rows; track $index) {
              <tr><td>{{ d(r.dateHeure) }}</td><td>{{ r.reference }} · {{ r.designation }}</td>
                <td><span class="tag" [class.ok]="r.type === 'ENTREE'" [class.warn]="r.type !== 'ENTREE'">{{ r.type === 'ENTREE' ? 'Entrée' : 'Sortie' }}</span></td>
                <td class="num">{{ r.quantite }}</td><td>{{ r.auteur }}</td><td>{{ r.idCommande ? '#' + r.idCommande : '' }}</td></tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucun mouvement.</div> }
    </div>
  `,
})
export class MouvementsComponent implements OnInit {
  produits: Produit[] = [];
  rows: Mouvement[] = [];
  f: any = { idProduit: null, type: 'ENTREE', quantite: 1 };
  fProduit = '';
  fType = '';
  d = dateFr;
  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.api.get<Produit[]>('/produits').subscribe((p) => { this.produits = p; if (p.length) this.f.idProduit = p[0].id; });
    this.charger();
  }
  charger(): void {
    this.api.get<Mouvement[]>('/mouvements', { produit: this.fProduit, type: this.fType }).subscribe({
      next: (r) => (this.rows = r), error: (e) => this.toast.afficher(e.message, true),
    });
  }
  enregistrer(): void {
    this.api.post<{ quantiteStock: number }>('/mouvements', { idProduit: Number(this.f.idProduit), type: this.f.type, quantite: Number(this.f.quantite) }).subscribe({
      next: (r) => { this.toast.afficher('Mouvement enregistré. Nouveau stock : ' + r.quantiteStock); this.charger(); },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
}
