import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';

// BookAppointment stays inside the appointments folder (as you want)
import { BookAppointmentComponent } from './components/appointments/book-appointment.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { MyAccountComponent } from './components/my-account/my-account.component';
import { therapistGuard } from './core/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'book', component: BookAppointmentComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'appointments', component: AppointmentsComponent, canActivate: [therapistGuard] },
    { path: 'my-account', component: MyAccountComponent },
    { path: '**', redirectTo: '' }
];
