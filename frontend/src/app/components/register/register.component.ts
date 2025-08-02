// src/app/components/register/register.component.ts
// -------------------------------------------------
// Register page: collects first name, last name, phone, email & password,
// submits a registration request, and shows success or error feedback.

import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, RegisterData } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    form!: FormGroup;
    successMessage = '';
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const payload: RegisterData = {
            firstName: this.form.value.firstName,
            lastName: this.form.value.lastName,
            phone: this.form.value.phone,
            email: this.form.value.email,
            password: this.form.value.password
        };

        this.auth.register(payload).subscribe({
            next: () => {
                this.successMessage = 'Registration request submitted successfully';
                this.errorMessage = '';
                this.form.reset();
            },
            error: err => {
                this.errorMessage = err.error?.message || 'Registration failed';
                this.successMessage = '';
            }
        });
    }
}
