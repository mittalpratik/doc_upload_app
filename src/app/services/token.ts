import { Injectable } from '@angular/core';
import { AuthTokens } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class Token {
  private ACCESS_KEY = 'access_token';
  private REFRESH_KEY = 'refresh_token';

  private accessTokenCache: string | null = null;
  private refreshTokenCache: string | null = null;

  setTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      localStorage.setItem(this.ACCESS_KEY, tokens.accessToken);
      this.accessTokenCache = tokens.accessToken;
    }
    if (tokens.refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, tokens.refreshToken);
      this.refreshTokenCache = tokens.refreshToken;
    }
  }

  clear(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.accessTokenCache = null;
    this.refreshTokenCache = null;
  }

  getAccessToken(): string | null {
    if (this.accessTokenCache) return this.accessTokenCache;
    const token = localStorage.getItem(this.ACCESS_KEY);
    this.accessTokenCache = token;
    return token;
  }

  getRefreshToken(): string | null {
    if (this.refreshTokenCache) return this.refreshTokenCache;
    const token = localStorage.getItem(this.REFRESH_KEY);
    this.refreshTokenCache = token;
    return token;
  }

  getTokenExpiration(token: string): number {
    try {
      // destructuring the split and fetching only payload at index 1
      const [, payloadBase64] = token.split('.');
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      if (payload.exp) {
        return payload.exp * 1000;
      }
    } catch (e) {
      console.warn('Invalid token format', e);
    }
    return 0;
  }
}
