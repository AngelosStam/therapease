import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { LoadingService } from '../../core/loading.service';

@Component({
    standalone: true,
    selector: 'app-book-appointment',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './book-appointment.component.html',
    styleUrl: './book-appointment.component.scss'
})
export class BookAppointmentComponent {
    // Form model (guests provide contact info; approved clients don’t need to)
    form = new FormGroup({
        guestName: new FormControl<string>('', []),
        guestEmail: new FormControl<string>('', []),
        guestPhone: new FormControl<string>('', []),
        appointmentDate: new FormControl<string>('', [Validators.required]),
        message: new FormControl<string>('', [])
    });

    success = false;
    error = '';
    busy = false;

    constructor(
        private http: HttpClient,
        public auth: AuthService,
        private toast: ToastService,
        private loading: LoadingService
    ) {
        // If a non-approved (pending/rejected) user reaches this page while "logged in",
        // immediately sign them out so the form flips to guest mode and submission works.
        const user = this.auth.user();
        if (this.auth.isLoggedIn() && user && user.status !== 'approved') {
            this.toast.info('Your account is not approved yet. You can book as a guest.');
            this.auth.clearSession();
        }

        // Dynamically enforce validators depending on session state.
        effect(() => {
            const loggedIn = this.auth.isLoggedIn();
            const currentUser = this.auth.user();
            const isApproved = !!currentUser && currentUser.status === 'approved';

            const { guestName, guestEmail, guestPhone } = this.form.controls;

            if (!loggedIn || !isApproved) {
                // Guest OR non-approved user → require contact info
                guestName.addValidators([Validators.required]);
                guestEmail.addValidators([Validators.required, Validators.email]);
                guestPhone.addValidators([Validators.required]);
            } else {
                // Approved logged-in client → contact fields optional
                guestName.clearValidators();
                guestEmail.clearValidators();
                guestPhone.clearValidators();
            }

            guestName.updateValueAndValidity({ emitEvent: false });
            guestEmail.updateValueAndValidity({ emitEvent: false });
            guestPhone.updateValueAndValidity({ emitEvent: false });
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        // Build payload: approved clients only send appointment/message; guests include contact info too.
        const raw = this.form.getRawValue();
        const appointmentISO = new Date(raw.appointmentDate as string).toISOString();

        const payload: any = {
            appointmentDate: appointmentISO,
            message: (raw.message || '') as string
        };

        const user = this.auth.user();
        const isApprovedClient = this.auth.isLoggedIn() && !!user && user.status === 'approved';

        if (!isApprovedClient) {
            // Guest (or logged-in but not approved): include contact details
            payload.guestName = raw.guestName;
            payload.guestEmail = raw.guestEmail;
            payload.guestPhone = raw.guestPhone;
        }
        // If the user is an approved client and has a valid token, the backend will attach their user id.

        this.busy = true;
        this.loading.begin();

        this.http.post('/api/appointments', payload).subscribe({
            next: () => {
                this.success = true;
                this.error = '';
                this.form.reset();
                this.toast.success('Your request has been sent! We will contact you soon to confirm.');
            },
            error: (err: any) => {
                this.error = err?.error?.error || 'Unable to submit your request. Please try again later.';
                this.toast.error(this.error);
                this.success = false;
                this.busy = false;
                this.loading.end();
            },
            complete: () => {
                this.busy = false;
                this.loading.end();
            }
        });
    }
}
