import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    type: ToastType;
    text: string;
    ttlMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private _toasts = signal<Toast[]>([]);
    toasts = this._toasts.asReadonly();
    private nextId = 1;

    show(text: string, type: ToastType = 'info', ttlMs = 3000) {
        const t: Toast = { id: this.nextId++, type, text, ttlMs };
        this._toasts.update(list => [...list, t]);
        setTimeout(() => this.dismiss(t.id), ttlMs);
    }

    success(text: string, ttlMs = 2500) { this.show(text, 'success', ttlMs); }
    error(text: string, ttlMs = 3500) { this.show(text, 'error', ttlMs); }
    info(text: string, ttlMs = 3000) { this.show(text, 'info', ttlMs); }

    dismiss(id: number) {
        this._toasts.update(list => list.filter(t => t.id !== id));
    }
}
