import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const therapistGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isTherapist()) return true;
    router.navigateByUrl('/');
    return false;
};
