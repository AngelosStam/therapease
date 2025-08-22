import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-wide-card',
    imports: [CommonModule],
    templateUrl: './wide-card.component.html',
    styleUrl: './wide-card.component.scss'
})
export class WideCardComponent {
    @Input() title = '';
    expanded = signal(true);
    toggle() { this.expanded.update(v => !v); }
}
