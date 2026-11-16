import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Kpi } from '../core/models';
import { money } from '../core/format';

@Component({
  selector: 'app-tableau',
  standalone: true,
  template: `
    <div class="page-head"><h1>Tableau de bord</h1></div>
    @if (erreur) { <p class="error">{{ erreur }}</p> }
    @if (k) {
      <div class="kpis">
        <div class="card kpi"><span class="muted">CA du jour</span><strong>{{ m(k.caJour) }}</strong><small>{{ k.ventesJour }} vente(s)</small></div>
        <div class="card kpi"><span class="muted">CA du mois</span><strong>{{ m(k.caMois) }}</strong>
          <small>{{ k.ventesMois }} vente(s) ·
            @if (k.variationMoisPct === null || k.variationMoisPct === undefined) { <span class="muted">pas de ventes le mois précédent</span> }
            @else { <span class="tag" [class.ok]="k.variationMoisPct >= 0" [class.danger]="k.variationMoisPct < 0">{{ variation(k.variationMoisPct) }} % vs mois précédent</span> }
          </small></div>
        <div class="card kpi"><span class="muted">CA du mois précédent</span><strong>{{ m(k.caMoisPrecedent) }}</strong></div>
        <div class="card kpi"><span class="muted">Valeur du stock</span><strong>{{ m(k.valeurStock) }}</strong></div>
        <div class="card kpi accent"><span class="muted">Produits en alerte</span><strong>{{ k.produitsEnAlerte }}</strong><small>dont {{ k.produitsEnRupture }} en rupture</small></div>
      </div>
      <div class="grid2">
        <div class="card"><h2>Chiffre d'affaires par jour (30 derniers jours)</h2>
          @if (k.caParJour.length) {
            <div class="bars">
              @for (d of k.caParJour; track d.jour) {
                <div class="bar-col" [title]="jj(d.jour) + ' : ' + m(d.chiffreAffaires) + ' (' + d.nbVentes + ' vente(s))'">
                  <div class="bar" [style.height.%]="haut(d.chiffreAffaires, maxCa())"></div>
                  <div class="bar-lbl">{{ jj(d.jour) }}</div>
                </div>
              }
            </div>
          } @else { <div class="empty">Aucune vente validée sur la période.</div> }
        </div>
        <div class="card"><h2>Mouvements de la semaine</h2>
          <p class="muted legend"><span class="dot in"></span>Entrées <span class="dot out"></span>Sorties</p>
          <div class="bars two">
            @for (d of k.mouvementsSemaine; track d.jour) {
              <div class="bar-col" [title]="jj(d.jour) + ' : ' + d.entrees + ' entrée(s), ' + d.sorties + ' sortie(s)'">
                <div class="pair">
                  <div class="bar in" [style.height.%]="haut(d.entrees, maxMvt())"></div>
                  <div class="bar out" [style.height.%]="haut(d.sorties, maxMvt())"></div>
                </div>
                <div class="bar-lbl">{{ jj(d.jour) }}</div>
              </div>
            }
          </div>
          <p class="muted">Total : {{ totalEntrees() }} entrées, {{ totalSorties() }} sorties.</p>
        </div>
      </div>
      <h2>Produits les plus vendus</h2>
      <div class="table-wrap">
        @if (k.topProduits.length) {
          <table><thead><tr><th>#</th><th>Référence</th><th>Désignation</th><th class="num">Quantité vendue</th><th class="num">CA</th></tr></thead>
            <tbody>
              @for (p of k.topProduits; track p.reference; let i = $index) {
                <tr><td>{{ i + 1 }}</td><td>{{ p.reference }}</td><td>{{ p.designation }}</td><td class="num">{{ p.quantiteVendue }}</td><td class="num">{{ m(p.chiffreAffaires) }}</td></tr>
              }
            </tbody></table>
        } @else { <div class="empty">Aucune vente validée pour le moment.</div> }
      </div>
    } @else if (!erreur) { <p class="muted">Chargement…</p> }
  `,
})
export class TableauComponent implements OnInit {
  k: Kpi | null = null;
  erreur = '';
  m = money;
  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<Kpi>('/kpi').subscribe({ next: (k) => (this.k = k), error: (e) => (this.erreur = e.message) });
  }
  jj(s: string): string {
    return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
  variation(v: number): string { return (v >= 0 ? '+' : '') + String(v).replace('.', ','); }
  haut(v: number, max: number): number { return Math.max(2, Math.round((Number(v) / max) * 100)); }
  maxCa(): number { return Math.max(1, ...(this.k?.caParJour ?? []).map((d) => Number(d.chiffreAffaires))); }
  maxMvt(): number { return Math.max(1, ...(this.k?.mouvementsSemaine ?? []).map((d) => Math.max(d.entrees, d.sorties))); }
  totalEntrees(): number { return (this.k?.mouvementsSemaine ?? []).reduce((a, d) => a + d.entrees, 0); }
  totalSorties(): number { return (this.k?.mouvementsSemaine ?? []).reduce((a, d) => a + d.sorties, 0); }
}
