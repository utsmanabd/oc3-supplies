import { Injectable } from '@angular/core';
import { getFirebaseBackend } from '../../authUtils';
import { User } from '../models/auth.models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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

    user!: User;
    currentUserValue: any;

    constructor(private http: HttpClient, private tokenService: TokenStorageService) { }

    /**
     * Performs the register
     * @param email email
     * @param password password
     */
    register(email: string, first_name: string, password: string) {
        // return getFirebaseBackend()!.registerUser(email, password).then((response: any) => {
        //     const user = response;
        //     return user;
        // });

        // Register Api
        return this.http.post(AUTH_API + 'signup', {
            email,
            first_name,
            password,
          }, httpOptions);
    }

    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(nik: string, password: string) {

        return this.http.post(AUTH_API + GlobalComponent.login, {
            nik,
            password
          }, httpOptions);
    }

    /**
     * Returns the current user
     */
    public currentUser(): any {
        return getFirebaseBackend()!.getAuthenticatedUser();
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

