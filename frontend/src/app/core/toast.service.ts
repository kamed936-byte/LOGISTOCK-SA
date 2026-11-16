import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  message = '';
  erreur = false;
  visible = false;
  private t: any;

  afficher(message: string, erreur = false): void {
    this.message = message;
    this.erreur = erreur;
    this.visible = true;
    clearTimeout(this.t);
    this.t = setTimeout(() => (this.visible = false), 3500);
  }
}
