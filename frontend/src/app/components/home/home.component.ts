// src/app/components/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    showWhy = false;
    showCbt = false;

    toggleWhy() {
        this.showWhy = !this.showWhy;
    }
    toggleCbt() {
        this.showCbt = !this.showCbt;
    }
}
