import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast-container.component.html',
    styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
    constructor(public toasts: ToastService) { }
    trackById = (_: number, t: any) => t.id;
}
