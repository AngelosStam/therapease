// core/clients.service.ts
// Angular service for therapist client-management APIs

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { User } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ClientsService {
    private readonly BASE = '/api/clients';

    constructor(private http: HttpClient) { }

    /** Approved clients list */
    listApproved(): Observable<User[]> {
        return this.http.get<User[]>(`${this.BASE}`);
    }

    /** Pending registration requests */
    listPending(): Observable<User[]> {
        return this.http.get<User[]>(`${this.BASE}/pending`);
    }

    /** Approve a client (therapist only) */
    approveClient(id: string): Observable<{ message: string; client: User }> {
        return this.http.patch<{ message: string; client: User }>(`${this.BASE}/${id}/approve`, {});
    }

    /** Reject a client (therapist only) */
    rejectClient(id: string): Observable<{ message: string; client: User }> {
        return this.http.patch<{ message: string; client: User }>(`${this.BASE}/${id}/reject`, {});
    }
}
