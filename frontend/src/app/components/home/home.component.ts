import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-home',
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
    showWhy = signal(false);
    showCbt = signal(false);
    toggleWhy() { this.showWhy.update(v => !v); }
    toggleCbt() { this.showCbt.update(v => !v); }
}
