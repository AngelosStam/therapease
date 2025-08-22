import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { LoadingService } from '../../../core/loading.service';

/**
 * LoginComponent
 * - Matches backend error messages EXACTLY for accurate user-friendly copy:
 *   • "User not found"                    -> Account does not exist...
 *   • "Wrong password"                    -> Wrong password
 *   • "Registration pending approval"     -> Pending approval
 *   • "Registration rejected"             -> Rejected
 * - No redirection to "Book" on failure (per request).
 * - Busy/loading state always ends on success AND error.
 */
@Component({
    standalone: true,
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    form = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    error: string | null = null;
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

        this.error = null;
        this.busy = true;
        this.loading.begin();

        const { email, password } = this.form.getRawValue();

        this.auth.login(email!, password!).subscribe({
            next: res => {
                this.auth.setSession(res.user, res.token);
                this.toast.success(`Welcome back, ${res.user.firstName}!`);
                this.router.navigateByUrl('/');
            },
            error: err => {
                const backendMsg = (err?.error?.error || '').toLowerCase();

                if (backendMsg.includes('user not found')) {
                    this.error = 'Account does not exist. You can still book a session as a guest in the relevant tab.';
                } else if (backendMsg.includes('wrong password')) {
                    this.error = 'Login was not successful. Wrong password.';
                } else if (backendMsg.includes('registration pending approval')) {
                    this.error = 'Login was not successful. Registration pending approval.';
                } else if (backendMsg.includes('registration rejected')) {
                    this.error = 'Login was not successful. Your registration was rejected.';
                } else {
                    this.error = 'Login failed. Please check your credentials and try again.';
                }

                this.toast.error(this.error);
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
