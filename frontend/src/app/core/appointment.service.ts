import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// If your Angular proxy forwards /api to backend, keep this.
// Otherwise switch to your backend URL (e.g., 'http://localhost:3000/api/appointments').
const BASE = '/api/appointments';

export interface Appointment {
    _id: string;
    appointmentDate?: string;
    client?: any;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
    message?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
    private hasApptCache = new Map<string, boolean>(); // key yyyy-mm-dd

    constructor(private http: HttpClient) { }

    // ----- Guest/Client create -----
    create(payload: {
        guestName?: string;
        guestEmail?: string;
        guestPhone?: string;
        message?: string;
        appointmentDate?: string;
    }): Observable<any> {
        return this.http.post(`${BASE}`, payload);
    }

    // ----- Therapist & Client lists -----
    listAll(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${BASE}`);
    }

    listMyApproved(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${BASE}/mine`);
    }

    getAppointmentRequests(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${BASE}/requests`);
    }

    // ----- Therapist actions -----
    approveAppointment(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/approve`, {});
    }

    rejectAppointmentRequest(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/reject`, {});
    }

    updateAppointmentDate(id: string, isoDate: string): Observable<Appointment> {
        return this.http.patch<Appointment>(`${BASE}/${id}`, { appointmentDate: isoDate });
    }

    cancelAppointment(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/cancel`, {});
    }

    // ----- Calendar queries -----
    getAppointmentsByDate(isoDate: string): Observable<Appointment[]> {
        const params = new HttpParams().set('date', isoDate);
        return this.http.get<Appointment[]>(`${BASE}/by-date`, { params });
    }

    refreshHasAppointmentCache(year: number, month: number): void {
        const params = new HttpParams().set('year', String(year)).set('month', String(month));
        this.http.get<Record<string, number>>(`${BASE}/overview`, { params }).subscribe({
            next: (map) => {
                this.clearMonthFromCache(year, month);
                Object.keys(map || {}).forEach((ymd) => this.hasApptCache.set(ymd, true));
            },
            error: () => {
                // leave cache as-is on error
            }
        });
    }

    hasAppointmentCached(date: Date): boolean {
        return this.hasApptCache.get(this.key(date)) || false;
    }
    setHasAppointmentCache(date: Date, value: boolean): void {
        const k = this.key(date);
        if (value) this.hasApptCache.set(k, true);
        else this.hasApptCache.delete(k);
    }

    // ----- utils -----
    private key(d: Date): string {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    private clearMonthFromCache(year: number, month: number): void {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
        for (const k of Array.from(this.hasApptCache.keys())) {
            if (k.startsWith(prefix)) this.hasApptCache.delete(k);
        }
    }
}
