// src/app/components/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
    menuOpen = false;
    menuPinned = false;

    constructor(public auth: AuthService, private router: Router) { }

    onMouseEnter() {
        this.menuOpen = true;
    }

    onMouseLeave() {
        this.menuOpen = this.menuPinned;
    }

    toggleMenu() {
        this.menuPinned = !this.menuPinned;
        this.menuOpen = this.menuPinned;
    }

    logout() {
        this.auth.logout();
        this.router.navigate(['/']);
        this.menuPinned = this.menuOpen = false;
    }
}
