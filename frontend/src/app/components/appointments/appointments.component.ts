// src/app/components/appointments/appointments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AppointmentService,
    Appointment
} from '../../services/appointment.service';

interface CalendarWeek { dates: (Date | null)[] }

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './appointments.component.html',
    styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
    activeTab: 'requests' | 'upcoming' = 'requests';
    requests: Appointment[] = [];
    upcoming: Appointment[] = [];
    calendar: CalendarWeek[] = [];
    selectedDate: Date | null = null;
    selectedAppointments: Appointment[] = [];

    editingRequestId: string | null = null;
    editRequestDate = '';
    selectedMessageId: string | null = null;

    editingUpcomingId: string | null = null;
    editUpcomingDate = '';

    currentMonth: number;
    currentYear: number;
    monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    constructor(private appt: AppointmentService) {
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
    }

    ngOnInit(): void {
        this.loadRequests();
        this.loadUpcoming();
    }

    switchTab(tab: 'requests' | 'upcoming') {
        this.activeTab = tab;
        this.cancelAllEdits();
        this.selectedMessageId = null;
        this.selectedDate = null;
        this.selectedAppointments = [];
    }

    private loadRequests() {
        this.appt.getAll().subscribe(list => {
            this.requests = list.filter(a => a.status === 'pending');
        });
    }

    private loadUpcoming() {
        this.appt.getAll().subscribe(list => {
            const now = new Date();
            this.upcoming = list.filter(a =>
                a.status === 'approved' &&
                new Date(a.appointmentDate!) >= now
            );
            this.buildCalendar(this.currentYear, this.currentMonth);
        });
    }

    approve(id: string) {
        const ap = this.requests.find(r => r._id === id);
        if (!ap?.appointmentDate) {
            alert('Please select date & time first');
            return;
        }
        this.appt.update(id, { appointmentDate: ap.appointmentDate })
            .subscribe(() => {
                this.loadRequests();
                this.loadUpcoming();
            });
    }

    cancelRequest(id: string) {
        this.appt.update(id, { status: 'cancelled' })
            .subscribe(() => this.loadRequests());
    }

    startEditRequest(id: string) {
        const ap = this.requests.find(r => r._id === id);
        this.editingRequestId = id;
        this.editRequestDate = ap?.appointmentDate
            ? new Date(ap.appointmentDate).toISOString().slice(0, 16)
            : '';
    }

    saveEditRequest(id: string) {
        if (!this.editRequestDate) return;
        const iso = new Date(this.editRequestDate).toISOString();
        this.appt.update(id, { appointmentDate: iso })
            .subscribe(() => {
                this.loadRequests();
                this.editingRequestId = null;
            });
    }

    cancelEditRequest() {
        this.editingRequestId = null;
        this.editRequestDate = '';
    }

    toggleMessage(id: string) {
        this.selectedMessageId = this.selectedMessageId === id ? null : id;
    }

    private cancelAllEdits() {
        this.cancelEditRequest();
        this.cancelEditUpcoming();
    }

    private buildCalendar(year: number, month: number) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeks: CalendarWeek[] = [];
        let week: (Date | null)[] = [];

        for (let i = 0; i < firstDay; i++) week.push(null);
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

    hasAppointment(date: Date | null): boolean {
        return !!date && this.upcoming.some(a =>
            this.isSameDay(date, new Date(a.appointmentDate!))
        );
    }

    onDateClick(date: Date | null) {
        if (!date) return;
        this.selectedDate = date;
        this.selectedAppointments = this.upcoming.filter(a =>
            this.isSameDay(date!, new Date(a.appointmentDate!))
        );
        this.cancelAllEdits();
    }

    startEditUpcoming(id: string, existing: string) {
        this.editingUpcomingId = id;
        this.editUpcomingDate = existing
            ? new Date(existing).toISOString().slice(0, 16)
            : '';
    }

    saveEditUpcoming(id: string) {
        if (!this.editUpcomingDate) return;
        const iso = new Date(this.editUpcomingDate).toISOString();
        this.appt.update(id, { appointmentDate: iso })
            .subscribe(() => {
                this.loadUpcoming();
                if (this.selectedDate) this.onDateClick(this.selectedDate);
                this.editingUpcomingId = null;
            });
    }

    cancelEditUpcoming() {
        this.editingUpcomingId = null;
        this.editUpcomingDate = '';
    }

    cancelAppointment(id: string) {
        if (!confirm('Cancel this session?')) return;
        this.appt.update(id, { status: 'cancelled' })
            .subscribe(() => {
                this.loadUpcoming();
                this.selectedAppointments =
                    this.selectedAppointments.filter(a => a._id !== id);
                if (!this.selectedAppointments.length) {
                    this.selectedDate = null;
                }
            });
    }

    private isSameDay(a: Date, b: Date) {
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    prevMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11; this.currentYear--;
        } else this.currentMonth--;
        this.buildCalendar(this.currentYear, this.currentMonth);
    }

    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0; this.currentYear++;
        } else this.currentMonth++;
        this.buildCalendar(this.currentYear, this.currentMonth);
    }
}
