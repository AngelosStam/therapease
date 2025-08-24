import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
    menuOpen = false;
    hoverLock = false;

    constructor(
        public auth: AuthService,
        private router: Router,
        private toast: ToastService
    ) { }

    toggleMenu() { this.menuOpen = !this.menuOpen; }
    onMouseEnter() { this.hoverLock = true; this.menuOpen = true; }
    onMouseLeave() { this.hoverLock = false; setTimeout(() => { if (!this.hoverLock) this.menuOpen = false; }, 150); }

    logout() {
        this.auth.clearSession();
        this.router.navigateByUrl('/');
        this.toast.info('You have been logged out successfully.');
    }

    @HostListener('document:click', ['$event'])
    onDocClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.closest('.hamburger')) this.menuOpen = false;
    }
}
