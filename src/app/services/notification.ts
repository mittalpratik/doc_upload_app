import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Notification {
  success(message: string): void {
    console.log('SUCCESS');
    alert(message);
  }

  error(message: string): void {
    console.log('ERROR');
    alert(message);
  }

  info(message: string): void {
    console.log('INFO');
  }

  warn(message: string): void {
    console.log('WARNING');
  }
}
