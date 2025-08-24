import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientsService } from '../../core/clients.service';
import { AppointmentService, Appointment } from '../../core/appointment.service';
import { AuthService, User } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { LoadingService } from '../../core/loading.service';
import { NotesService, ClientNote } from '../../core/notes.service';
import { Subscription } from 'rxjs';

type SortDir = 'asc' | 'desc';

@Component({
    standalone: true,
    selector: 'app-my-account',
    imports: [CommonModule, FormsModule],
    templateUrl: './my-account.component.html',
    styleUrl: './my-account.component.scss',
})
export class MyAccountComponent implements OnInit, OnDestroy {
    activeTab: 'clients' | 'access' = 'clients';
    clients: User[] = [];
    pending: User[] = [];
    showHistoryClientId: string | null = null;
    sessionsByClient: Appointment[] = [];
    userSessions: Appointment[] = [];

    // Notes UI state
    openNotesClientId: string | null = null;
    notesLoading = false;
    clientNotes: Record<string, ClientNote[]> = {};
    noteDraft = '';
    editNoteId: string | null = null;
    editNoteDraft = '';

    // Filters and sorting
    clientFilter = '';
    pendingFilter = '';
    clientSort: { key: 'name' | 'phone' | 'email' | 'since'; dir: SortDir } = { key: 'name', dir: 'asc' };
    pendingSort: { key: 'name' | 'phone' | 'email' | 'requested'; dir: SortDir } = { key: 'requested', dir: 'desc' };

    // Scheduling UI state
    scheduleOpen = false;
    schedulingClient: User | null = null;
    scheduleForm = {
        datetimeLocal: '',
        frequency: 'none' as 'none' | 'weekly' | 'biweekly' | 'monthly',
        endDate: '', // yyyy-mm-dd (inclusive) when repeating
    };

    private sub?: Subscription;

    constructor(
        public auth: AuthService,
        private clientsSvc: ClientsService,
        private apptSvc: AppointmentService,
        private notesSvc: NotesService,
        private toast: ToastService,
        private loading: LoadingService
    ) { }

    ngOnInit(): void {
        if (this.auth.isTherapist()) this.loadTherapistData();
        if (this.auth.isLoggedIn()) {
            // Client-facing list is already filtered by the API to 'approved'
            this.apptSvc.listMyApproved().subscribe({ next: (list) => (this.userSessions = list) });
        }

        // 🔔 Whenever appointments change anywhere (approve/reject/update/cancel),
        // refresh the open client's history so cancelled sessions vanish immediately.
        this.sub = this.apptSvc.changed$.subscribe(() => {
            if (this.showHistoryClientId) {
                this.refreshClientHistory(this.showHistoryClientId);
            }
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    switchTab(tab: 'clients' | 'access') {
        this.activeTab = tab;
    }

    loadTherapistData() {
        this.clientsSvc.listApproved().subscribe({ next: (d) => (this.clients = d) });
        this.clientsSvc.listPending().subscribe({ next: (d) => (this.pending = d) });
    }

    // ===== Approve / Reject =====
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
            complete: () => this.loading.end(),
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
            complete: () => this.loading.end(),
        });
    }

    // ===== Sorting / Filtering =====
    private toggleDir(dir: SortDir): SortDir {
        return dir === 'asc' ? 'desc' : 'asc';
    }

    sortClients(key: 'name' | 'phone' | 'email' | 'since') {
        this.clientSort = { key, dir: this.clientSort.key === key ? this.toggleDir(this.clientSort.dir) : 'asc' };
    }

    sortPending(key: 'name' | 'phone' | 'email' | 'requested') {
        this.pendingSort = { key, dir: this.pendingSort.key === key ? this.toggleDir(this.pendingSort.dir) : 'asc' };
    }

    filteredAndSortedClients(): User[] {
        const q = this.clientFilter.trim().toLowerCase();
        const filtered = this.clients.filter((c) => {
            if (!q) return true;
            const name = this.fullName(c).toLowerCase();
            const email = (c.email || '').toLowerCase();
            const phone = (c.phone || '').toLowerCase();
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });

        const cmp = (a: User, b: User) => {
            let va = '';
            let vb = '';
            switch (this.clientSort.key) {
                case 'name':
                    va = this.fullName(a).toLowerCase();
                    vb = this.fullName(b).toLowerCase();
                    break;
                case 'phone':
                    va = (a.phone || '').toLowerCase();
                    vb = (b.phone || '').toLowerCase();
                    break;
                case 'email':
                    va = (a.email || '').toLowerCase();
                    vb = (b.email || '').toLowerCase();
                    break;
                case 'since':
                    va = new Date((a as any).approvedAt || a.createdAt || 0).toISOString();
                    vb = new Date((b as any).approvedAt || b.createdAt || 0).toISOString();
                    break;
            }
            const r = va < vb ? -1 : va > vb ? 1 : 0;
            return this.clientSort.dir === 'asc' ? r : -r;
        };
        return filtered.sort(cmp);
    }

    filteredAndSortedPending(): User[] {
        const q = this.pendingFilter.trim().toLowerCase();
        const filtered = this.pending.filter((p) => {
            if (!q) return true;
            const name = this.fullName(p).toLowerCase();
            const email = (p.email || '').toLowerCase();
            const phone = (p.phone || '').toLowerCase();
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });

        const cmp = (a: User, b: User) => {
            let va = '';
            let vb = '';
            switch (this.pendingSort.key) {
                case 'name':
                    va = this.fullName(a).toLowerCase();
                    vb = this.fullName(b).toLowerCase();
                    break;
                case 'phone':
                    va = (a.phone || '').toLowerCase();
                    vb = (b.phone || '').toLowerCase();
                    break;
                case 'email':
                    va = (a.email || '').toLowerCase();
                    vb = (b.email || '').toLowerCase();
                    break;
                case 'requested':
                    va = new Date(a.createdAt || 0).toISOString();
                    vb = new Date(b.createdAt || 0).toISOString();
                    break;
            }
            const r = va < vb ? -1 : va > vb ? 1 : 0;
            return this.pendingSort.dir === 'asc' ? r : -r;
        };
        return filtered.sort(cmp);
    }

    // ===== History (hide cancelled/rejected) =====
    toggleHistory(clientId: string) {
        this.showHistoryClientId = this.showHistoryClientId === clientId ? null : clientId;
        if (this.showHistoryClientId) {
            this.refreshClientHistory(clientId);
        }
    }

    private refreshClientHistory(clientId: string) {
        this.apptSvc.listAll().subscribe({
            next: (list) => {
                this.sessionsByClient = (list || []).filter(
                    (a) =>
                        a.client?._id === clientId &&
                        a.appointmentDate &&
                        a.status !== 'cancelled' &&
                        a.status !== 'rejected'
                );
            },
        });
    }

    // ===== Notes =====
    toggleNotes(clientId: string) {
        if (this.openNotesClientId === clientId) {
            this.openNotesClientId = null;
            return;
        }
        this.openNotesClientId = clientId;
        if (!this.clientNotes[clientId]) {
            this.notesLoading = true;
            this.notesSvc.list(clientId).subscribe({
                next: (notes) => (this.clientNotes[clientId] = notes || []),
                error: () => this.toast.error('Failed to load notes'),
                complete: () => (this.notesLoading = false),
            });
        }
    }

    cancelNoteDraft() {
        this.noteDraft = '';
    }

    addNote(clientId: string) {
        const text = this.noteDraft.trim();
        if (!text) return;
        this.notesSvc.create(clientId, text).subscribe({
            next: (note) => {
                if (!this.clientNotes[clientId]) this.clientNotes[clientId] = [];
                this.clientNotes[clientId].unshift(note);
                this.noteDraft = '';
                this.toast.success('Note added.');
            },
            error: () => this.toast.error('Could not add note.'),
        });
    }

    startEditNote(noteId: string, currentText: string) {
        this.editNoteId = noteId;
        this.editNoteDraft = currentText;
    }

    cancelEditNote() {
        this.editNoteId = null;
        this.editNoteDraft = '';
    }

    saveNote(clientId: string, noteId: string) {
        const text = this.editNoteDraft.trim();
        if (!text) return;
        this.notesSvc.update(noteId, text).subscribe({
            next: (updated) => {
                const arr = this.clientNotes[clientId] || [];
                const idx = arr.findIndex((n) => n._id === noteId);
                if (idx > -1) arr[idx] = updated;
                this.cancelEditNote();
                this.toast.success('Note updated.');
            },
            error: () => this.toast.error('Could not update note.'),
        });
    }

    deleteNote(clientId: string, noteId: string) {
        if (!confirm('Delete this note?')) return;
        this.notesSvc.remove(noteId).subscribe({
            next: () => {
                const arr = this.clientNotes[clientId] || [];
                this.clientNotes[clientId] = arr.filter((n) => n._id !== noteId);
                this.toast.info('Note deleted.');
            },
            error: () => this.toast.error('Could not delete note.'),
        });
    }

    // ===== Scheduling =====
    openSchedule(client: User) {
        this.schedulingClient = client;
        this.scheduleForm = { datetimeLocal: '', frequency: 'none', endDate: '' };
        this.scheduleOpen = true;
    }

    closeSchedule() {
        this.scheduleOpen = false;
        this.schedulingClient = null;
    }

    confirmSchedule() {
        if (!this.schedulingClient) return;
        if (!this.scheduleForm.datetimeLocal) {
            this.toast.error('Please select date and time.');
            return;
        }
        const startISO = new Date(this.scheduleForm.datetimeLocal).toISOString();
        this.loading.begin();

        if (this.scheduleForm.frequency === 'none') {
            this.apptSvc.createForClient(this.schedulingClient._id, startISO).subscribe({
                next: () => {
                    this.toast.success('Session scheduled.');
                    this.closeSchedule();
                    if (this.showHistoryClientId === this.schedulingClient!._id) {
                        this.refreshClientHistory(this.schedulingClient!._id);
                    }
                },
                error: () => {
                    this.toast.error('Could not schedule session.');
                    this.loading.end();
                },
                complete: () => this.loading.end(),
            });
        } else {
            if (!this.scheduleForm.endDate) {
                this.toast.error('Please select an end date for the recurring series.');
                this.loading.end();
                return;
            }
            const endISO = new Date(this.scheduleForm.endDate + 'T23:59:59').toISOString();
            this.apptSvc
                .createRecurringForClient(this.schedulingClient._id, startISO, this.scheduleForm.frequency, endISO)
                .subscribe({
                    next: () => {
                        this.toast.success('Recurring series created.');
                        this.closeSchedule();
                        if (this.showHistoryClientId === this.schedulingClient!._id) {
                            this.refreshClientHistory(this.schedulingClient!._id);
                        }
                    },
                    error: () => {
                        this.toast.error('Could not create recurring series.');
                        this.loading.end();
                    },
                    complete: () => this.loading.end(),
                });
        }
    }

    // utils
    fullName(u: User) {
        return `${u.firstName} ${u.lastName}`;
    }
}
