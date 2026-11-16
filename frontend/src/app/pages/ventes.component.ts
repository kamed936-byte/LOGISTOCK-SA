import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Commande, STATUTS } from '../core/models';
import { dateFr, money } from '../core/format';

@Component({
  selector: 'app-ventes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head"><h1>Ventes</h1><button class="btn accent" (click)="router.navigateByUrl('/ventes/nouvelle')">Nouvelle vente</button></div>
    <div class="toolbar">
      <select [(ngModel)]="statut" (ngModelChange)="charger()">
        <option value="">Tous les statuts</option><option value="BROUILLON">Brouillons</option>
        <option value="VALIDEE">Validées</option><option value="ANNULEE">Annulées</option>
      </select>
    </div>
    <div class="table-wrap">
      @if (rows.length) {
        <table><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Statut</th><th class="num">Total</th><th>Facture</th><th></th></tr></thead>
          <tbody>
            @for (o of rows; track o.id) {
              <tr><td>#{{ o.id }}</td><td>{{ d(o.dateCommande) }}</td><td>{{ o.client }}</td>
                <td><span class="tag" [class.ok]="o.statut === 'VALIDEE'" [class.danger]="o.statut === 'ANNULEE'" [class.off]="o.statut === 'BROUILLON'">{{ st[o.statut][0] }}</span></td>
                <td class="num">{{ m(o.total) }}</td><td>{{ o.numeroFacture }}</td>
                <td class="actions">
                  @if (o.statut === 'BROUILLON') {
                    <button class="btn small" (click)="router.navigateByUrl('/ventes/' + o.id)">Modifier</button>
                    <button class="btn small accent" (click)="valider(o)">Valider</button>
                    <button class="btn small danger" (click)="annuler(o)">Annuler</button>
                  } @else if (o.statut === 'VALIDEE') {
                    <button class="btn small" (click)="pdf(o.id)">Facture PDF</button>
                  }
                </td></tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucune vente.</div> }
    </div>
  `,
})
export class VentesComponent implements OnInit {
  rows: Commande[] = [];
  statut = '';
  st = STATUTS;
  d = dateFr;
  m = money;
  constructor(public router: Router, private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.charger(); }
  charger(): void {
    this.api.get<Commande[]>('/commandes', { statut: this.statut }).subscribe({ next: (r) => (this.rows = r), error: (e) => this.toast.afficher(e.message, true) });
  }
  valider(o: Commande): void {
    if (!confirm('Valider cette vente ? Le stock sera diminué et la facture créée.')) return;
    this.api.post<{ numero: string }>(`/commandes/${o.id}/valider`).subscribe({
      next: (r) => { this.toast.afficher('Vente validée. Facture ' + r.numero); this.charger(); },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
  annuler(o: Commande): void {
    if (!confirm('Annuler ce brouillon ?')) return;
    this.api.post(`/commandes/${o.id}/annuler`).subscribe({
      next: () => { this.toast.afficher('Vente annulée'); this.charger(); },
      error: (e) => this.toast.afficher(e.message, true),
    });
  }
  pdf(id: number): void { this.api.ouvrirFacture(id, (m) => this.toast.afficher(m, true)); }
}
