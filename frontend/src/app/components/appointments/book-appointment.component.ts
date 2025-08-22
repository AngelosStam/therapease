import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../core/appointment.service';
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
        private svc: AppointmentService,
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

        // Validators: guests must provide contact info; approved clients don’t
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
                // Approved logged-in client → no guest validators
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

        this.busy = true;
        this.loading.begin();

        this.svc.create(this.form.getRawValue()).subscribe({
            next: () => {
                this.success = true;
                this.error = '';
                this.form.reset();
                this.toast.success('Your request has been sent! We will contact you soon to confirm.');
            },
            error: err => {
                // Typical backend error if a non‑approved user tries with a token:
                // by clearing session on init, this should not happen anymore.
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
