import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthenticationService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private authService: AuthenticationService,
        private tokenService: TokenStorageService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (!request.url.includes("auth/login") && err.status === 401) {
                // auto logout if 401 response returned from api
                this.logOut();
              } else if (err.status === 403) {
                // Forbidden: Attempt to refresh token
                return this.handleForbiddenError(request, next);
              }
              const error = err.error.message || err.statusText;
              return throwError(error);
        }))
    }

    private handleForbiddenError(
        request: HttpRequest<any>,
        next: HttpHandler
      ): Observable<HttpEvent<any>> {
        // Call refreshToken() and retry the original request
        let refreshToken = this.tokenService.getRefreshToken();
        if (refreshToken !== null) {
          return this.authService.updateToken(refreshToken).pipe(
            switchMap((response: any) => {
              if (response.accessToken) {
                // Refresh token successful, update the token
                this.tokenService.setToken(response.accessToken);
                // Clone the original request with the new token
                const newRequest = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.accessToken}`,
                  },
                });
                // Retry the request with the new token
                return next.handle(newRequest);
              } else {
                // Refresh token failed: Logout user
                this.logOut();
                return throwError("Refresh token failed");
              }
            })
          );
        } else {
          this.logOut();
          return throwError("Refresh token failed");
        }
      }
    
      private logOut() {
        this.authService.logout();
        location.reload();
      }
}
