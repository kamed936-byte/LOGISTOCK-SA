import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Client, CommandeDetail, Produit } from '../core/models';
import { money } from '../core/format';

@Component({
  selector: 'app-vente-editeur',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head"><h1>{{ id ? 'Modifier la vente #' + id : 'Nouvelle vente' }}</h1>
      <button class="btn ghost" (click)="retour()">Retour</button></div>
    <div class="card">
      <label>Client *</label>
      <select [(ngModel)]="idClient">
        <option [ngValue]="null">Choisir un client…</option>
        @for (c of clients; track c.id) { <option [ngValue]="c.id">{{ c.nom }} {{ c.prenom }}</option> }
      </select>
      <div class="inline-form vente-ajout" style="margin-top:14px">
        <div><label>Produit</label>
          <select [(ngModel)]="idProduit">
            @for (p of produits; track p.id) { <option [ngValue]="p.id">{{ p.designation }} (stock {{ p.quantiteStock }}, {{ m(p.prix) }})</option> }
          </select></div>
        <div><label>Quantité</label><input type="number" min="1" [(ngModel)]="qte"></div>
        <button class="btn" type="button" (click)="ajouter()">Ajouter</button>
      </div>
    </div>
    <div class="table-wrap">
      @if (lignes.length) {
        <table><thead><tr><th>Produit</th><th class="num">Prix</th><th class="num">Quantité</th><th class="num">Sous-total</th><th></th><th></th></tr></thead>
          <tbody>
            @for (l of lignes; track l.idProduit; let i = $index) {
              <tr><td>{{ prod(l.idProduit)?.reference }} · {{ prod(l.idProduit)?.designation }}</td>
                <td class="num">{{ m(prod(l.idProduit)?.prix) }}</td>
                <td class="num"><input type="number" min="1" style="width:80px" [ngModel]="l.quantite" (ngModelChange)="majQte(l, $event)" [name]="'q' + i"></td>
                <td class="num">{{ m(sousTotal(l)) }}</td>
                <td>@if (insuffisant(l)) { <span class="tag danger">Stock : {{ prod(l.idProduit)?.quantiteStock }}</span> }</td>
                <td><button class="btn small danger" (click)="retirer(i)">Retirer</button></td></tr>
            }
          </tbody></table>
      } @else { <div class="empty">Aucune ligne : ajoutez un produit.</div> }
    </div>
    <p class="error">{{ erreur }}</p>
    <div class="page-head" style="margin-top:14px">
      <strong>Total : {{ m(total()) }}</strong>
      <span>
        <button class="btn" (click)="enregistrer(false)">Enregistrer le brouillon</button>
        <button class="btn accent" (click)="enregistrer(true)">Enregistrer et valider</button></span>
    </div>
  `,
})
export class VenteEditeurComponent implements OnInit {
  id: number | null = null;
  clients: Client[] = [];
  produits: Produit[] = [];
  lignes: { idProduit: number; quantite: number }[] = [];
  idClient: number | null = null;
  idProduit: number | null = null;
  qte = 1;
  erreur = '';
  m = money;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    this.id = p ? Number(p) : null;
    forkJoin({
      clients: this.api.get<Client[]>('/clients'),
      produits: this.api.get<Produit[]>('/produits'),
      existante: this.id ? this.api.get<CommandeDetail>('/commandes/' + this.id) : of(null),
    }).subscribe({
      next: (r) => {
        this.clients = r.clients;
        this.produits = r.produits;
        this.idProduit = r.produits[0]?.id ?? null;
        if (r.existante) {
          this.idClient = r.existante.commande.idClient;
          this.lignes = r.existante.lignes.map((l) => ({ idProduit: l.idProduit, quantite: l.quantite }));
        }
      },
      error: (e) => (this.erreur = e.message),
    });
  }

  prod(id: number): Produit | undefined { return this.produits.find((p) => p.id === id); }
  sousTotal(l: { idProduit: number; quantite: number }): number { return l.quantite * Number(this.prod(l.idProduit)?.prix ?? 0); }
  total(): number { return this.lignes.reduce((a, l) => a + this.sousTotal(l), 0); }
  insuffisant(l: { idProduit: number; quantite: number }): boolean { return l.quantite > (this.prod(l.idProduit)?.quantiteStock ?? 0); }
  majQte(l: { quantite: number }, v: any): void { l.quantite = Math.max(1, parseInt(v, 10) || 1); }
  retirer(i: number): void { this.lignes.splice(i, 1); }

  ajouter(): void {
    if (!this.idProduit) return;
    const q = Math.max(1, parseInt(String(this.qte), 10) || 1);
    const l = this.lignes.find((x) => x.idProduit === this.idProduit);
    if (l) l.quantite += q; else this.lignes.push({ idProduit: this.idProduit, quantite: q });
  }

  enregistrer(valider: boolean): void {
    this.erreur = '';
    if (!this.idClient) { this.erreur = 'Choisissez un client.'; return; }
    if (!this.lignes.length) { this.erreur = 'Ajoutez au moins un produit.'; return; }
    const corps = { idClient: this.idClient, lignes: this.lignes };
    const appel = this.id ? this.api.put<CommandeDetail>('/commandes/' + this.id, corps) : this.api.post<CommandeDetail>('/commandes', corps);
    appel.subscribe({
      next: (d) => {
        if (!valider) { this.toast.afficher('Brouillon enregistré'); this.retour(); return; }
        this.api.post<{ numero: string }>(`/commandes/${d.commande.id}/valider`).subscribe({
          next: (r) => { this.toast.afficher('Vente validée. Facture ' + r.numero); this.retour(); },
          error: (e) => {
            // le brouillon existe maintenant : on bascule dessus pour ne pas le dupliquer
            this.id = d.commande.id;
            this.erreur = e.message;
          },
        });
      },
      error: (e) => (this.erreur = e.message),
    });
  }
  retour(): void { this.router.navigateByUrl('/ventes'); }
}
