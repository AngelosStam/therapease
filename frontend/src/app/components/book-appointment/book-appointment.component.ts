// src/app/components/book-appointment/book-appointment.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule
} from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-book-appointment',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './book-appointment.component.html',
    styleUrls: ['./book-appointment.component.scss']
})
export class BookAppointmentComponent implements OnInit {
    form!: FormGroup;
    success = false;
    error = '';

    constructor(
        private fb: FormBuilder,
        private appt: AppointmentService,
        public auth: AuthService
    ) { }

    ngOnInit(): void {
        if (this.auth.isLoggedIn) {
            // Logged-in clients only need date & message
            this.form = this.fb.group({
                appointmentDate: ['', Validators.required],
                message: ['']
            });
        } else {
            // Guests need to supply name, email, phone + date & message
            this.form = this.fb.group({
                guestName: ['', Validators.required],
                guestEmail: ['', [Validators.required, Validators.email]],
                guestPhone: ['', Validators.required],
                appointmentDate: ['', Validators.required],
                message: ['']
            });
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            return;
        }

        // Build payload depending on guest vs. client
        const data = this.auth.isLoggedIn
            ? {
                appointmentDate: this.form.value.appointmentDate,
                message: this.form.value.message
            }
            : {
                guestName: this.form.value.guestName,
                guestEmail: this.form.value.guestEmail,
                guestPhone: this.form.value.guestPhone,
                appointmentDate: this.form.value.appointmentDate,
                message: this.form.value.message
            };

        this.appt.create(data).subscribe({
            next: () => {
                this.success = true;
                this.error = '';
                this.form.reset();
            },
            error: err => {
                this.error = err.error?.message || 'Request failed';
                this.success = false;
            }
        });
    }
}
