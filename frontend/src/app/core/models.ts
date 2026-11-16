export interface Utilisateur { id: number; nom: string; email: string; role: string; idRole?: number; actif: boolean; }
export interface Role { id: number; nom: string; }
export interface Categorie { id: number; nom: string; nbProduits: number; }
export interface Produit {
  id: number; reference: string; designation: string; categorie: string; idCategorie: number;
  prix: number; quantiteStock: number; seuilAlerte: number; enAlerte: boolean;
}
export interface Mouvement {
  dateHeure: string; reference: string; designation: string; type: string;
  quantite: number; auteur: string; idCommande: number | null;
}
export interface Alerte {
  reference: string; designation: string; categorie: string;
  quantiteStock: number; seuilAlerte: number; etat: string;
}
export interface Client {
  id: number; nom: string; prenom: string; email: string; telephone: string; adresse: string; nbAchats: number;
}
export interface Commande {
  id: number; dateCommande: string; statut: string; total: number; idClient: number; client: string;
  auteur: string; idFacture: number | null; numeroFacture: string | null;
}
export interface Ligne {
  idProduit: number; reference: string; designation: string; quantite: number;
  prixUnitaire: number; sousTotal: number; stockDisponible: number;
}
export interface CommandeDetail { commande: Commande; lignes: Ligne[]; }
export interface Kpi {
  caJour: number; ventesJour: number; caMois: number; ventesMois: number; caMoisPrecedent: number;
  variationMoisPct: number | null; valeurStock: number; produitsEnAlerte: number; produitsEnRupture: number;
  caParJour: { jour: string; nbVentes: number; chiffreAffaires: number }[];
  topProduits: { reference: string; designation: string; quantiteVendue: number; chiffreAffaires: number }[];
  mouvementsSemaine: { jour: string; entrees: number; sorties: number }[];
}

export const ROLE_ADMIN = 'Administrateur';
export const ROLE_STOCK = 'Gestionnaire de stock';
export const ROLE_COMMERCIAL = 'Commercial';

export const STATUTS: Record<string, [string, string]> = {
  BROUILLON: ['Brouillon', 'off'],
  VALIDEE: ['Validée', 'ok'],
  ANNULEE: ['Annulée', 'danger'],
};
