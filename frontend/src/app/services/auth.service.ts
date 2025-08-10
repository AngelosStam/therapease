// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    _id: string;
    name: string;
    email: string;
    role?: string;
}

export interface RegisterData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _user: User | null = null;
    private _token = '';

    constructor(private http: HttpClient) {
        const u = localStorage.getItem('therapease_user');
        const t = localStorage.getItem('therapease_token');
        if (u && t) {
            try {
                this._user = JSON.parse(u);
                this._token = t;
            } catch {
                localStorage.removeItem('therapease_user');
                localStorage.removeItem('therapease_token');
            }
        }
    }

    login(creds: { email: string; password: string }): Observable<User> {
        return this.http
            .post<{ user: User; token: string }>(
                `${environment.apiUrl}/auth/login`,
                creds
            )
            .pipe(
                tap(res => {
                    this._user = res.user;
                    this._token = res.token;
                    localStorage.setItem('therapease_user', JSON.stringify(res.user));
                    localStorage.setItem('therapease_token', res.token);
                }),
                map(res => res.user)
            );
    }

    register(data: RegisterData): Observable<any> {
        return this.http.post(
            `${environment.apiUrl}/auth/register`,
            data
        );
    }

    logout(): void {
        this._user = null;
        this._token = '';
        localStorage.removeItem('therapease_user');
        localStorage.removeItem('therapease_token');
    }

    get user(): User | null {
        return this._user;
    }

    get isLoggedIn(): boolean {
        return !!this._user;
    }

    get isTherapist(): boolean {
        if (!this._user) return false;
        const email = this._user.email.toLowerCase().trim();
        return this._user.role === 'therapist'
            || email === 'angelos_stamatis@outlook.com';
    }

    get token(): string {
        return this._token;
    }
}
