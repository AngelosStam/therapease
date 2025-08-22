import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    private _count = signal(0);               // active requests count
    loading = signal(false);

    begin() {
        const c = this._count() + 1;
        this._count.set(c);
        if (!this.loading()) this.loading.set(true);
    }

    end() {
        const c = Math.max(0, this._count() - 1);
        this._count.set(c);
        if (c === 0) this.loading.set(false);
    }

    // Wrap an observable-like subscribe with begin/end (manual for our components)
}
