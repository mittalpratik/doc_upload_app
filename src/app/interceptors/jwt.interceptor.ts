import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { Auth } from '../services/auth';
import { Token } from '../services/token';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private tokenService: Token,
    private authService: Auth
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // skip all requests to login/refresh endpoints
    if (this.isAuthUrl(req.url)) {
      return next.handle(req);
    }

    const accessToken = this.tokenService.getAccessToken();
    const authReq = accessToken ? this.addTokenHeader(req, accessToken) : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isAuthUrl(url: string): boolean {
    return url.endsWith('/auth/login') || url.endsWith('/auth/refresh');
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(tokens => {
          // tokens returned by refreshToken() must include accessToken
          const newAccess = tokens.accessToken;
          if (!newAccess) {
            // no new token -> force logout
            this.authService.logout();
            return throwError(() => new Error('No access token on refresh'));
          }
          this.tokenService.setTokens(tokens);
          this.refreshTokenSubject.next(newAccess);
          return next.handle(this.addTokenHeader(request, newAccess));
        }),
        catchError(err => {
          // refresh failed -> logout
          this.authService.logout();
          return throwError(() => err);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Wait until refreshTokenSubject contains non-null token, then retry
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addTokenHeader(request, token as string));
        })
      );
    }
  }
}
