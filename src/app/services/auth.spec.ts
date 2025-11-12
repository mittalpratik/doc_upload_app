import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Token } from './token';
import { Auth } from './auth';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../models/auth.model';

describe('AuthService', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  let tokenService: Token;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Auth, Token]
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(Token);
    localStorage.clear();
  });

  afterEach(() => httpMock.verify());

  it('should login and store tokens', (done) => {
    const payload: LoginRequest = {
        email: 'upload@document.com',
        password: 'FeUpload2025'
    };  
    const mockResp = { 
        accessToken: 'a', 
        refreshToken: 'r', 
        expiresIn: 60 
    };
    spyOn(tokenService, 'setTokens').and.callThrough();

    service.login(payload).subscribe(res => {
      expect(res).toEqual(mockResp);
      expect(tokenService.setTokens).toHaveBeenCalledWith(mockResp);
      expect(localStorage.getItem('access_token')).toBe('a');
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResp);
  });

  it('should return error on invalid credentials', (done) => {
    const payload: LoginRequest = {
        email: 'pra@tik.co',
        password: 'Mitt'
    }; 
    service.login(payload).subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        expect(err.status).toBe(401);
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should call refresh and rotate tokens', (done) => {
    const mockResp = { accessToken: 'newA', refreshToken: 'newR', expiresIn: 60 };
    spyOn(tokenService, 'setTokens').and.callThrough();

    service.refreshToken().subscribe(res => {
      expect(res.accessToken).toBe('newA');
      expect(tokenService.setTokens).toHaveBeenCalledWith(mockResp);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'oldRefresh' });
    req.flush(mockResp);
  });
});
