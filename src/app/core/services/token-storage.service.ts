import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { GlobalComponent } from 'src/app/global-component';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'currentUser';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor() { }

  signOut(): void {
    window.sessionStorage.clear();
  }

  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  // public getToken(): string | null {
  //   return localStorage.getItem('token');
  // }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // public getUser(): any {
  //   const user = window.localStorage.getItem(USER_KEY);    
  //   if (user) {
  //     return JSON.parse(user);
  //   }

  //   return {};
  // }




  encryptData(data: string, key: string, isObject: boolean = false): string {
    let rawData = isObject ? JSON.stringify(data) : data
    const encrypted = CryptoJS.AES.encrypt(rawData, key).toString();
    return encrypted;
  }

  decryptData(encryptedData: string, key: string, isObject: boolean = false): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
    return isObject ? JSON.parse(decrypted) : decrypted;
  }

  setAuthData(token: any, refreshToken: any, userData: any) {
    this.setToken(token)
    this.setRefreshToken(refreshToken)
    this.setUserData(userData)
  }

  setUserData(userData: any) {
    const encryptedUserData = this.encryptData(userData, GlobalComponent.USER_ENCRYPTION_KEY, true)
    localStorage.setItem(GlobalComponent.USER_KEY, encryptedUserData)
  }

  setToken(token: string) {
    const encryptedToken = this.encryptData(token, GlobalComponent.ACCESS_TOKEN_ENCRYPTION_KEY)
    localStorage.setItem(GlobalComponent.TOKEN_KEY, encryptedToken);
  }

  setRefreshToken(refreshToken: string) {
    const encryptedRefreshToken = this.encryptData(refreshToken, GlobalComponent.REFRESH_TOKEN_ENCRYPTION_KEY)
    localStorage.setItem(GlobalComponent.REFRESH_TOKEN_KEY, encryptedRefreshToken)
  }

  getToken(): string | null {
    const token = localStorage.getItem(GlobalComponent.TOKEN_KEY);
    if (token) {
      try {
        const decryptedData = this.decryptData(token, GlobalComponent.ACCESS_TOKEN_ENCRYPTION_KEY)
        return decryptedData
      } catch (err) {
        console.error(err)
        return null
      }
    }
    return null
  }

  getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem(GlobalComponent.REFRESH_TOKEN_KEY)
    if (refreshToken) {
      try {
        const decryptedData = this.decryptData(refreshToken, GlobalComponent.REFRESH_TOKEN_ENCRYPTION_KEY)
        return decryptedData
      } catch (err) {
        console.error(err)
        return null
      }
    }
    return null
  }

  getUser(): string | null {
    const user = window.localStorage.getItem(GlobalComponent.USER_KEY);
    if (user) {
      try {
        const decryptedData = this.decryptData(user, GlobalComponent.USER_ENCRYPTION_KEY, true)
        return decryptedData;
      } catch (err) {
        console.error(err);
        return null
      }
    }
    return null;
  }

  public isTokenValid(): boolean {
      return !!this.getToken()
  }
}
