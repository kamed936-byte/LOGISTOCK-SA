import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Fenêtre modale simple : le contenu est projeté, le formulaire vit dans la page appelante. */
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="overlay" (click)="fermer.emit()">
      <div class="modal-form" (click)="$event.stopPropagation()">
        <h2>{{ titre }}</h2>
        <ng-content />
      </div>
    </div>`,
})
export class ModalComponent {
  @Input() titre = '';
  @Output() fermer = new EventEmitter<void>();
}
