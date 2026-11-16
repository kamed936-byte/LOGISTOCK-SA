import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Alerte } from '../core/models';

@Component({
  selector: 'app-alertes',
  standalone: true,
  template: `
    <div class="page-head"><h1>Alertes de stock</h1></div>
    <p class="muted">Produits en rupture ou dont le stock est passé sous le seuil d'alerte.</p>
    @if (erreur) { <p class="error">{{ erreur }}</p> }
    <div class="table-wrap">
      @if (alertes.length) {
        <table><thead><tr><th>Référence</th><th>Désignation</th><th>Catégorie</th><th class="num">Stock</th><th class="num">Seuil</th><th>État</th></tr></thead>
          <tbody>
            @for (a of alertes; track a.reference) {
              <tr><td>{{ a.reference }}</td><td>{{ a.designation }}</td><td>{{ a.categorie }}</td>
                <td class="num">{{ a.quantiteStock }}</td><td class="num">{{ a.seuilAlerte }}</td>
                <td><span class="tag" [class.danger]="a.etat === 'RUPTURE'" [class.warn]="a.etat !== 'RUPTURE'">{{ a.etat === 'RUPTURE' ? 'Rupture' : 'Stock bas' }}</span></td></tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucune alerte : tous les stocks sont au-dessus de leur seuil.</div> }
    </div>
  `,
})
export class AlertesComponent implements OnInit {
  alertes: Alerte[] = [];
  erreur = '';
  constructor(private api: ApiService) {}
  ngOnInit(): void {
    this.api.get<Alerte[]>('/alertes').subscribe({ next: (a) => (this.alertes = a), error: (e) => (this.erreur = e.message) });
  }
}
