import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
    { 
        path: '', 
        redirectTo: 'login', 
        pathMatch: 'full' 
    },
    { 
        path: 'login', 
        loadComponent: () => import('./auth/login/login').then(c => c.Login) 
    },
    {
        path: 'upload',
        loadComponent: () => import('./upload/upload/upload').then(c => c.Upload),
        canActivate: [AuthGuard]
    },
    { 
        path: '**', 
        redirectTo: 'login' 
    }
];
