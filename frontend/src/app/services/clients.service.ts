// src/app/services/clients.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Matches backend User model (client side) */
export interface Client {
    _id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
    private base = `${environment.apiUrl}/clients`;

    constructor(private http: HttpClient) { }

    getApproved(): Observable<Client[]> {
        return this.http.get<Client[]>(`${this.base}/approved`);
    }

    getPending(): Observable<Client[]> {
        return this.http.get<Client[]>(`${this.base}/pending`);
    }

    approveClient(id: string): Observable<Client> {
        return this.http.put<Client>(`${this.base}/approve/${id}`, {});
    }

    rejectClient(id: string): Observable<any> {
        return this.http.put(`${this.base}/reject/${id}`, {});
    }
}
