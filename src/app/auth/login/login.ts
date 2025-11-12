import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm: FormGroup;

  loading = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private auth: Auth, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.loginForm.get('email') as FormControl;
  }

  get password() {
    return this.loginForm.get('password') as FormControl;
  }

  submit() {
    if (this.loginForm.invalid || this.loading) return;

    this.errorMessage = null;
    this.loading = true;

    const payload = {
      email: this.email.value.trim(),
      password: this.password.value
    };

    this.auth.login(payload)
      .pipe(takeUntil(this.destroy$),
          finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/upload');
        },
        error: (err: unknown) => {
          this.errorMessage = this.mapError(err);
        }
      });

  }

  private mapError(err: any): string {
    if (!navigator.onLine) return 'No internet connection. Please check your network.';
    if (err?.status === 401) return 'Invalid email or password.';
    if (err?.status === 0) return 'Network error — server unreachable.';
    if (err?.status === 413) return 'Request too large.';
    return err?.error?.message || 'Something went wrong. Please try again.';
  }

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
  }

}
