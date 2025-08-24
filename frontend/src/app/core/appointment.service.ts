import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

const BASE = '/api/appointments';

export interface Appointment {
    _id: string;
    appointmentDate?: string;
    client?: any;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: string;
    seriesId?: string | null;
    recurrenceFrequency?: 'none' | 'weekly' | 'biweekly' | 'monthly';
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
    private hasApptCache = new Map<string, boolean>(); // key yyyy-mm-dd

    // 🔔 change broadcast so other components can react (e.g., MyAccount history)
    private _changed = new Subject<void>();
    changed$ = this._changed.asObservable();

    constructor(private http: HttpClient) { }

    // ---- Therapist create (one-off) ----
    createForClient(clientId: string, appointmentISO: string): Observable<any> {
        return this.http
            .post(`${BASE}/client/${clientId}`, { appointmentDate: appointmentISO })
            .pipe(tap(() => this._changed.next()));
    }

    // ---- Therapist create recurring with end date ----
    createRecurringForClient(
        clientId: string,
        startISO: string,
        frequency: 'weekly' | 'biweekly' | 'monthly',
        endISO: string
    ): Observable<any> {
        return this.http
            .post(`${BASE}/client/${clientId}/recurring`, {
                startDate: startISO,
                frequency,
                endDate: endISO,
            })
            .pipe(tap(() => this._changed.next()));
    }

    cancelRecurringSeries(seriesId: string): Observable<any> {
        return this.http
            .patch(`${BASE}/series/${seriesId}/cancel`, {})
            .pipe(tap(() => this._changed.next()));
    }

    // ---- Lists ----
    listAll(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${BASE}`);
    }

    listMyApproved(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${BASE}/mine`);
    }

    getAppointmentRequests(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${BASE}/requests`);
    }

    // ---- Actions ----
    approveAppointment(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/approve`, {}).pipe(tap(() => this._changed.next()));
    }

    rejectAppointmentRequest(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/reject`, {}).pipe(tap(() => this._changed.next()));
    }

    updateAppointmentDate(id: string, isoDate: string): Observable<Appointment> {
        return this.http
            .patch<Appointment>(`${BASE}/${id}`, { appointmentDate: isoDate })
            .pipe(tap(() => this._changed.next()));
    }

    cancelAppointment(id: string): Observable<any> {
        return this.http.patch(`${BASE}/${id}/cancel`, {}).pipe(tap(() => this._changed.next()));
    }

    // ---- Calendar queries ----
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

    // ---- utils ----
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
