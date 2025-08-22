import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientsService } from '../../core/clients.service';
import { AppointmentService, Appointment } from '../../core/appointment.service';
import { AuthService, User } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { LoadingService } from '../../core/loading.service';

@Component({
    standalone: true,
    selector: 'app-my-account',
    imports: [CommonModule],
    templateUrl: './my-account.component.html',
    styleUrl: './my-account.component.scss'
})
export class MyAccountComponent implements OnInit {
    activeTab: 'clients' | 'access' = 'clients';
    clients: User[] = [];
    pending: User[] = [];
    showHistoryClientId: string | null = null;
    sessionsByClient: Appointment[] = [];
    userSessions: Appointment[] = [];

    constructor(
        public auth: AuthService,
        private clientsSvc: ClientsService,
        private apptSvc: AppointmentService,
        private toast: ToastService,
        private loading: LoadingService
    ) { }

    ngOnInit(): void {
        if (this.auth.isTherapist()) this.loadTherapistData();
        if (this.auth.isLoggedIn()) {
            this.apptSvc.listMyApproved().subscribe({ next: list => this.userSessions = list });
        }
    }

    switchTab(tab: 'clients' | 'access') { this.activeTab = tab; }

    loadTherapistData() {
        this.clientsSvc.listApproved().subscribe({ next: d => this.clients = d });
        this.clientsSvc.listPending().subscribe({ next: d => this.pending = d });
    }

    toggleHistory(clientId: string) {
        this.showHistoryClientId = this.showHistoryClientId === clientId ? null : clientId;
        if (this.showHistoryClientId) {
            this.apptSvc.listAll().subscribe({
                next: list => this.sessionsByClient = list.filter(a => a.client?._id === clientId && a.appointmentDate)
            });
        }
    }

    approveClient(id: string) {
        this.loading.begin();
        this.clientsSvc.approveClient(id).subscribe({
            next: () => {
                this.toast.success('Client has been approved.');
                this.loadTherapistData();
            },
            error: () => {
                this.toast.error('Could not approve client. Please try again.');
                this.loading.end();
            },
            complete: () => {
                this.loading.end();
            }
        });
    }

    rejectClient(id: string) {
        this.loading.begin();
        this.clientsSvc.rejectClient(id).subscribe({
            next: () => {
                this.toast.info('Client has been rejected.');
                this.loadTherapistData();
            },
            error: () => {
                this.toast.error('Could not reject client. Please try again.');
                this.loading.end();
            },
            complete: () => {
                this.loading.end();
            }
        });
    }


    fullName(u: User) { return `${u.firstName} ${u.lastName}`; }
}
