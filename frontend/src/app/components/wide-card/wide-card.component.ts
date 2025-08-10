// src/app/components/wide-card/wide-card.component.ts
// ---------------------------------------------------

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-wide-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './wide-card.component.html',
    styleUrls: ['./wide-card.component.scss']
})
export class WideCardComponent {
    /** Card title */
    @Input() title = '';

    /** Expanded state */
    expanded = false;

    /** Toggle expanded/collapsed */
    toggle() {
        this.expanded = !this.expanded;
    }
}
