import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * User model used across the app.
 * NOTE: `approvedAt` is optional and present when a client's registration
 * has been approved by the therapist. It fixes TS2339 in MyAccount.
 */
export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role: 'client' | 'therapist';
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
    updatedAt?: string;
    approvedAt?: string; // <-- added to support "Since = approvedAt || createdAt"
}

interface LoginResponse { message: string; user: User; token: string; }
interface RegisterResponse { message: string; user: User; token?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _user = signal<User | null>(this.restoreUser());
    private _token = signal<string | null>(localStorage.getItem('token'));

    // Derived state
    isLoggedIn = computed(() => !!this._user());
    isTherapist = computed(() => this._user()?.role === 'therapist');
    user = computed(() => this._user());

    constructor(private http: HttpClient) { }

    private restoreUser(): User | null {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    }

    login(email: string, password: string) {
        return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, { email, password });
    }

    register(payload: { firstName: string; lastName: string; phone: string; email: string; password: string; }) {
        return this.http.post<RegisterResponse>(`${environment.apiBase}/auth/register`, payload);
    }

    setSession(user: User, token: string) {
        this._user.set(user);
        this._token.set(token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    }

    clearSession() {
        this._user.set(null);
        this._token.set(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    get token(): string | null {
        return this._token();
    }

    me() {
        return this.http.get<{ user: User }>(`${environment.apiBase}/auth/me`);
        // If your backend expects an Authorization header, ensure you have an HTTP interceptor
        // attaching the token to requests (you already appear to have one in the project).
    }
}
