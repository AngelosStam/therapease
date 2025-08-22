import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Adjust BASE to match your proxy setup:
 * If Angular dev proxy forwards /api -> backend, keep '/api'.
 * Otherwise, set full URL (e.g., 'http://localhost:3000/api').
 */
const BASE = '/api/clients';

export interface Client {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role: 'client' | 'therapist';
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
    updatedAt?: string;
    approvedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
    constructor(private http: HttpClient) { }

    /** NEW canonical methods */
    getClients(): Observable<Client[]> {
        return this.http.get<Client[]>(`${BASE}`);
    }

    getPending(): Observable<Client[]> {
        return this.http.get<Client[]>(`${BASE}/pending`);
    }

    approveClient(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/approve`, {});
    }

    rejectClient(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/reject`, {});
    }

    /** ✅ Backwards-compatible aliases so existing components keep working */
    listApproved(): Observable<Client[]> {
        return this.getClients();
    }

    listPending(): Observable<Client[]> {
        return this.getPending();
    }
}
