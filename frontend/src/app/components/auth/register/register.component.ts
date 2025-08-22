import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { LoadingService } from '../../../core/loading.service';

/**
 * RegisterComponent
 * - Matches backend responses EXACTLY for clear UX:
 *   • success (no token): message "Registration resubmitted" OR "Registration pending approval"
 *   • error: "Email already registered"
 * - Therapist bootstrap (token returned) logs in immediately.
 * - Busy/loading state always ends on success AND error.
 * - Leaves your HTML/SCSS intact.
 */
@Component({
    standalone: true,
    selector: 'app-register',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    form = new FormGroup({
        firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
    });

    successMessage = '';
    errorMessage = '';
    busy = false;

    constructor(
        private auth: AuthService,
        private router: Router,
        private toast: ToastService,
        private loading: LoadingService
    ) { }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.successMessage = '';
        this.errorMessage = '';
        this.busy = true;
        this.loading.begin();

        this.auth.register(this.form.getRawValue() as any).subscribe({
            next: res => {
                // If token is returned, user (therapist bootstrap) is fully registered and approved:
                if ((res as any)?.token && (res as any)?.user) {
                    const { user, token } = res as any;
                    this.auth.setSession(user, token);
                    this.toast.success('Registration complete! Welcome aboard.');
                    this.router.navigateByUrl('/');
                    return;
                }

                // Otherwise, we use the message field to distinguish flows:
                const message = ((res as any)?.message || '').toString().toLowerCase();

                if (message.includes('registration resubmitted')) {
                    this.successMessage = 'Your registration was resubmitted and is now pending approval.';
                } else if (message.includes('registration pending approval')) {
                    this.successMessage = 'Your registration is pending therapist approval.';
                } else {
                    // Fallback if backend changes wording; still friendly:
                    this.successMessage = 'Your registration has been received.';
                }

                this.toast.info(this.successMessage);
                this.form.reset();
            },
            error: err => {
                const backendMsg = (err?.error?.error || '').toString().toLowerCase();

                if (backendMsg.includes('email already registered')) {
                    this.errorMessage = 'This email is already registered. Please log in instead.';
                } else {
                    this.errorMessage = 'We couldn’t complete your registration. Please try again.';
                }

                this.toast.error(this.errorMessage);
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
