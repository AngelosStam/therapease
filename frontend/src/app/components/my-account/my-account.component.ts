// src/app/components/my-account/my-account.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientsService, Client } from '../../services/clients.service';
import {
    AppointmentService,
    Appointment
} from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-my-account',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-account.component.html',
    styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit {
    // Therapist:
    activeTab: 'clients' | 'access' = 'clients';
    clients: Client[] = [];
    pending: Client[] = [];
    allAppointments: Appointment[] = [];
    showHistoryClientId: string | null = null;
    sessionsByClient: Appointment[] = [];

    // Client:
    userSessions: Appointment[] = [];

    constructor(
        public auth: AuthService,
        private clientsService: ClientsService,
        private apptService: AppointmentService
    ) { }

    ngOnInit(): void {
        if (this.auth.isTherapist) {
            this.clientsService.getApproved().subscribe(list => this.clients = list);
            this.clientsService.getPending().subscribe(list => this.pending = list);
            this.apptService.getAll().subscribe(list => this.allAppointments = list);
        } else if (this.auth.isLoggedIn) {
            this.apptService.getMine().subscribe(list => this.userSessions = list);
        }
    }

    switchTab(tab: 'clients' | 'access') {
        this.activeTab = tab;
        this.showHistoryClientId = null;
        this.sessionsByClient = [];
    }

    toggleHistory(clientId: string) {
        if (this.showHistoryClientId === clientId) {
            this.showHistoryClientId = null;
            this.sessionsByClient = [];
        } else {
            this.showHistoryClientId = clientId;
            this.sessionsByClient = this.allAppointments.filter(
                a => a.client?._id === clientId
            );
        }
    }

    approveClient(id: string) {
        this.clientsService.approveClient(id).subscribe(() => {
            this.pending = this.pending.filter(c => c._id !== id);
            this.clientsService.getApproved().subscribe(list => this.clients = list);
        });
    }

    rejectClient(id: string) {
        if (!confirm('Reject this registration?')) return;
        this.clientsService.rejectClient(id).subscribe(() => {
            this.pending = this.pending.filter(c => c._id !== id);
        });
    }
}
