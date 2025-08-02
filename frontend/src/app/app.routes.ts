// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { BookAppointmentComponent } from './components/book-appointment/book-appointment.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { MyAccountComponent } from './components/my-account/my-account.component';

import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'book', component: BookAppointmentComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    {
        path: 'appointments',
        component: AppointmentsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'my-account',
        component: MyAccountComponent,
        canActivate: [AuthGuard]
    },
    { path: '**', redirectTo: '' }
];
