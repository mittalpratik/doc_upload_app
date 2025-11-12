import { TestBed } from '@angular/core/testing';
import { Token } from './token';
import { AuthTokens } from '../models/auth.model';

describe('TokenService', () => {
  let svc: Token;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [Token] });
    svc = TestBed.inject(Token);
    localStorage.clear();
  });

  it('set/get/clear tokens', () => {
    const payload: AuthTokens = {
            accessToken: 'A',
            refreshToken: 'R'
        };
    svc.setTokens(payload);
    expect(svc.getAccessToken()).toBe('A');
    expect(localStorage.getItem('access_token')).toBe('A');
    svc.clear();
    expect(svc.getAccessToken()).toBeNull();
  });
});
