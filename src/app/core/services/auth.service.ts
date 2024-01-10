import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GlobalComponent } from "../../global-component";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenStorageService } from './token-storage.service';

const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

@Injectable({ providedIn: 'root' })

/**
 * Auth-service Component
 */
export class AuthenticationService {
    private jwtHelper: JwtHelperService = new JwtHelperService();

    constructor(private http: HttpClient, private tokenService: TokenStorageService) { }

    login(nik: string, password: string) {

        return this.http.post(AUTH_API + GlobalComponent.login, {
            nik,
            password
          }, httpOptions);
    }

    logout() {
        localStorage.removeItem(GlobalComponent.USER_KEY);
        localStorage.removeItem(GlobalComponent.TOKEN_KEY);
        localStorage.removeItem(GlobalComponent.REFRESH_TOKEN_KEY);
    }

    updateToken(refreshToken: string) {
        return this.http.post(AUTH_API + GlobalComponent.refreshToken, { refresh_token: refreshToken }, httpOptions)
    }

    isAuthenticated(): boolean {
        const token = this.tokenService.getToken()
        return token !== null && !this.jwtHelper.isTokenExpired(token);
    }
}

