import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppointmentService } from '../../core/appointment.service';
import { ToastService } from '../../core/toast.service';

type SortDir = 'asc' | 'desc';
type ReqSortKey = 'kind' | 'name' | 'phone' | 'email' | 'requested' | 'proposed';

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './appointments.component.html',
    styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
    activeTab: 'requests' | 'upcoming' = 'requests';

    // ----- Requests state -----
    requests: any[] = [];
    selectedMessageId: string | null = null;

    // Inline edit (request date)
    editingRequestId: string | null = null;
    editRequestDate: string | null = null;

    // Filter & sorting for the Appointment Requests table
    // (these pair with the "Search requests" input and clickable headers in your HTML)
    requestsFilter = '';
    requestsSort: { key: ReqSortKey; dir: SortDir } = { key: 'requested', dir: 'desc' };

    // ----- Calendar (Upcoming) state -----
    monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();

    calendar: { dates: (Date | null)[] }[] = [];
    selectedDate: Date | null = null;
    selectedAppointments: any[] = [];

    // Inline edit (upcoming session)
    editingUpcomingId: string | null = null;
    editUpcomingDate: string | null = null;

    constructor(
        private appts: AppointmentService,
        private toast: ToastService
    ) { }

    // ────────────────────────────────────────────────────────────
    // Lifecycle
    // ────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadRequests();
        this.buildCalendar(this.currentYear, this.currentMonth);
        // Preload markers for current month so dots show immediately
        this.appts.refreshHasAppointmentCache(this.currentYear, this.currentMonth);
    }

    // ────────────────────────────────────────────────────────────
    // Tab handling
    // ────────────────────────────────────────────────────────────
    switchTab(tab: 'requests' | 'upcoming'): void {
        this.activeTab = tab;
        if (tab === 'upcoming') {
            this.buildCalendar(this.currentYear, this.currentMonth);
            // Ensure markers are preloaded whenever we land on this tab
            this.appts.refreshHasAppointmentCache(this.currentYear, this.currentMonth);
            if (this.selectedDate) this.loadAppointmentsForDate(this.selectedDate);
            else this.selectedAppointments = [];
        }
    }

    // ────────────────────────────────────────────────────────────
    // Requests: load, filter, sort, actions
    // ────────────────────────────────────────────────────────────
    loadRequests(): void {
        this.appts.getAppointmentRequests().subscribe({
            next: list => (this.requests = list || []),
            error: () => this.toast.error('Failed to load appointment requests')
        });
    }

    toggleMessage(id: string): void {
        this.selectedMessageId = this.selectedMessageId === id ? null : id;
    }

    startEditRequest(id: string): void {
        this.editingRequestId = id;
        const row = this.requests.find(r => r._id === id);
        if (row?.appointmentDate) {
            const d = new Date(row.appointmentDate);
            this.editRequestDate = this.toLocalInputValue(d);
        } else {
            this.editRequestDate = null;
        }
    }

    cancelEditRequest(): void {
        this.editingRequestId = null;
        this.editRequestDate = null;
    }

    saveEditRequest(id: string): void {
        if (!this.editRequestDate) {
            this.toast.info('Please pick a date & time first.');
            return;
        }
        const iso = new Date(this.editRequestDate).toISOString();

        this.appts.updateAppointmentDate(id, iso).subscribe({
            next: updated => {
                const idx = this.requests.findIndex(r => r._id === id);
                if (idx > -1) this.requests[idx].appointmentDate = updated.appointmentDate || iso;

                if (this.selectedDate) this.loadAppointmentsForDate(this.selectedDate);

                this.toast.success('Appointment updated');
                this.cancelEditRequest();
                this.refreshCalendarMarkers();
            },
            error: () => this.toast.error('Failed to update appointment')
        });
    }

    approve(id: string): void {
        this.appts.approveAppointment(id).subscribe({
            next: () => {
                this.requests = this.requests.filter(r => r._id !== id);
                this.toast.success('Request approved');
                this.refreshCalendarMarkers();
                if (this.selectedDate) this.loadAppointmentsForDate(this.selectedDate);
            },
            error: () => this.toast.error('Failed to approve request')
        });
    }

    cancelRequest(id: string): void {
        this.appts.rejectAppointmentRequest(id).subscribe({
            next: () => {
                this.requests = this.requests.filter(r => r._id !== id);
                this.toast.info('Request rejected');
            },
            error: () => this.toast.error('Failed to reject request')
        });
    }

    // ----- Filter + Sort helpers for Requests table -----
    sortRequests(key: ReqSortKey): void {
        const dir: SortDir =
            this.requestsSort.key === key ? (this.requestsSort.dir === 'asc' ? 'desc' : 'asc') : 'asc';
        this.requestsSort = { key, dir };
    }

    filteredAndSortedRequests(): any[] {
        const q = (this.requestsFilter || '').trim().toLowerCase();

        // Filter by name / phone / email / message
        const filtered = this.requests.filter(r => {
            if (!q) return true;
            const name = r.client
                ? `${r.client.firstName || ''} ${r.client.lastName || ''}`.toLowerCase()
                : (r.guestName || '').toLowerCase();
            const phone = (r.client?.phone || r.guestPhone || '').toLowerCase();
            const email = (r.client?.email || r.guestEmail || '').toLowerCase();
            const message = (r.message || '').toLowerCase();
            return name.includes(q) || phone.includes(q) || email.includes(q) || message.includes(q);
        });

        // Sort by chosen column
        const toStr = (v: any) => (v ?? '').toString().toLowerCase();

        const valFor = (r: any, key: ReqSortKey): string => {
            switch (key) {
                case 'kind': return r.client ? 'client' : 'guest';
                case 'name': return r.client
                    ? `${r.client.firstName || ''} ${r.client.lastName || ''}`.toLowerCase()
                    : toStr(r.guestName);
                case 'phone': return toStr(r.client?.phone || r.guestPhone);
                case 'email': return toStr(r.client?.email || r.guestEmail);
                case 'requested': return new Date(r.createdAt || 0).toISOString();
                case 'proposed': return new Date(r.appointmentDate || 0).toISOString();
            }
        };

        const { key, dir } = this.requestsSort;
        const sorted = filtered.sort((a, b) => {
            const va = valFor(a, key);
            const vb = valFor(b, key);
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return dir === 'asc' ? cmp : -cmp;
        });

        return sorted;
    }

    // ────────────────────────────────────────────────────────────
    // Calendar (Upcoming)
    // ────────────────────────────────────────────────────────────
    buildCalendar(year: number, month: number): void {
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);

        const firstWeekday = first.getDay();
        const daysInMonth = last.getDate();

        const weeks: { dates: (Date | null)[] }[] = [];
        let week: (Date | null)[] = [];

        for (let i = 0; i < firstWeekday; i++) week.push(null);

        for (let d = 1; d <= daysInMonth; d++) {
            week.push(new Date(year, month, d));
            if (week.length === 7) {
                weeks.push({ dates: week });
                week = [];
            }
        }

        if (week.length) {
            while (week.length < 7) week.push(null);
            weeks.push({ dates: week });
        }

        this.calendar = weeks;
    }

    prevMonth(): void {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear -= 1;
        } else {
            this.currentMonth -= 1;
        }
        this.buildCalendar(this.currentYear, this.currentMonth);
        this.refreshCalendarMarkers();
        this.selectedDate = null;
        this.selectedAppointments = [];
    }

    nextMonth(): void {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear += 1;
        } else {
            this.currentMonth += 1;
        }
        this.buildCalendar(this.currentYear, this.currentMonth);
        this.refreshCalendarMarkers();
        this.selectedDate = null;
        this.selectedAppointments = [];
    }

    onDateClick(date: Date | null): void {
        if (!date) return;
        this.selectedDate = date;
        this.loadAppointmentsForDate(date);
    }

    hasAppointment(date: Date | null): boolean {
        if (!date) return false;
        if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
            return (this.selectedAppointments?.length || 0) > 0;
        }
        return this.appts.hasAppointmentCached(date);
    }

    private loadAppointmentsForDate(date: Date): void {
        this.appts.getAppointmentsByDate(date.toISOString()).subscribe({
            next: list => {
                this.selectedAppointments = list || [];
                this.appts.setHasAppointmentCache(date, this.selectedAppointments.length > 0);
            },
            error: () => this.toast.error('Failed to load appointments for the selected date')
        });
    }

    private refreshCalendarMarkers(): void {
        this.appts.refreshHasAppointmentCache(this.currentYear, this.currentMonth);
    }

    // ────────────────────────────────────────────────────────────
    // Upcoming: inline edit & cancel
    // ────────────────────────────────────────────────────────────
    startEditUpcoming(id: string, currentISO: string): void {
        this.editingUpcomingId = id;
        this.editUpcomingDate = this.toLocalInputValue(new Date(currentISO));
    }

    cancelEditUpcoming(): void {
        this.editingUpcomingId = null;
        this.editUpcomingDate = null;
    }

    saveEditUpcoming(id: string): void {
        if (!this.editUpcomingDate) {
            this.toast.info('Please pick a new date & time first.');
            return;
        }
        const iso = new Date(this.editUpcomingDate).toISOString();

        this.appts.updateAppointmentDate(id, iso).subscribe({
            next: updated => {
                if (this.selectedDate) {
                    const before = this.selectedAppointments.find(a => a._id === id)?.appointmentDate;
                    const movedAway =
                        before && !this.isSameDay(new Date(updated.appointmentDate || iso), this.selectedDate);

                    const idx = this.selectedAppointments.findIndex(a => a._id === id);
                    if (idx > -1) {
                        if (movedAway) {
                            this.selectedAppointments.splice(idx, 1);
                        } else {
                            this.selectedAppointments[idx].appointmentDate = updated.appointmentDate || iso;
                        }
                    }
                }

                this.toast.success('Appointment updated');
                this.cancelEditUpcoming();
                this.refreshCalendarMarkers();
            },
            error: () => this.toast.error('Failed to update appointment')
        });
    }

    cancelAppointment(id: string): void {
        this.appts.cancelAppointment(id).subscribe({
            next: () => {
                const beforeCount = this.selectedAppointments.length;
                this.selectedAppointments = this.selectedAppointments.filter(a => a._id !== id);

                if (this.selectedDate && beforeCount > 0 && this.selectedAppointments.length === 0) {
                    this.appts.setHasAppointmentCache(this.selectedDate, false);
                }

                this.toast.info('Appointment cancelled');
            },
            error: () => this.toast.error('Failed to cancel appointment')
        });
    }

    // ────────────────────────────────────────────────────────────
    // Utils
    // ────────────────────────────────────────────────────────────
    private isSameDay(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    private toLocalInputValue(d: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
}
