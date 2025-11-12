import { Component } from '@angular/core';
import { Auth } from './services/auth';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UploadService } from './services/uploadService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'doc_upload_app';
    
  constructor(public auth: Auth, private router: Router, private upload: UploadService) {}

  get isAuth() {
    return this.auth.isAuthenticated();
  }

  logout() {
    this.auth.logout();
    this.upload.clearAllAndCancel();
    this.router.navigate(['/login']);
  }
}
