import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private tokenService: TokenStorageService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      
      const expectedRole = route.data['expectedRole']
      const user: any = this.tokenService.getUser()
  
      if (user) {
        if (expectedRole && user.role_name === expectedRole) {
          return true
        }
      }
      
      this.router.navigate(['/not-found'])
      return false;
  
  }
  
}
