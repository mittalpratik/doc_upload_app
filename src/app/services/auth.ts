import { Injectable } from '@angular/core';
import { Token } from './token';
import { HttpClient } from '@angular/common/http';
import { AuthTokens, LoginRequest } from '../models/auth.model';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private tokenService:Token) {}

  login(payload: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.baseUrl}/login`, payload).pipe(
      tap(tokens => {
        this.tokenService.setTokens(tokens);
      }),
      catchError(err => {
        console.error('[AuthService] Login error', err);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.tokenService.clear();
  }

  isAuthenticated(): boolean {
    const token = this.tokenService.getAccessToken();
    if (!token) return false;

    const exp = this.tokenService.getTokenExpiration(token);
    return exp > Date.now();
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token found'));
    }

    return this.http
      .post<AuthTokens>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(
        tap(tokens => {
          this.tokenService.setTokens(tokens);
        }),
        catchError(err => {
          console.error('[AuthService] Refresh error', err);
          this.logout();
          return throwError(() => err);
        })
      );
  }

}
