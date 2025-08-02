// src/app/services/appointment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Appointment {
    _id: string;
    client?: { _id: string; name: string; email: string; phone: string };
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    appointmentDate?: string;
    message?: string;
    status: 'pending' | 'approved' | 'cancelled';
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
    private base = `${environment.apiUrl}/appointments`;

    /** New request */
    create(data: Partial<Appointment>): Observable<Appointment> {
        return this.http.post<Appointment>(this.base, data);
    }

    /** Therapist-only: get all */
    getAll(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(this.base);
    }

    /** Client-only: get mine */
    getMine(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.base}/my`);
    }

    /** Therapist-only: update (approve/cancel) */
    update(id: string, data: Partial<Appointment>): Observable<Appointment> {
        return this.http.put<Appointment>(`${this.base}/${id}`, data);
    }

    constructor(private http: HttpClient) { }
}
