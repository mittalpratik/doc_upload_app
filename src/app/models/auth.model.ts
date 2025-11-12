export interface LoginRequest { 
    email: string; 
    password: string;
}

export interface AuthTokens {
    accessToken: string; 
    refreshToken?: string; 
    expiresIn?: number; 
}
