import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Notification } from '../services/notification';
import { Auth } from '../services/auth';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private notif: Notification, private auth: Auth) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.notif.error('Network error — please check connectivity.');
        } else if (err.status >= 500) {
          this.notif.error('Server error, try again later.');
        } else if (err.status === 403) {
          this.notif.error('You do not have permission to perform this action.');
        } else if (err.status === 401) {
            if(err.url?.includes('upload')){
              return throwError(() => err);
            }
        } else {
          // any unexpected error
          const msg = err.error?.message || err.statusText || 'Request failed';
          this.notif.error(msg);
        }
        return throwError(() => err);
      })
    );
  }
}
