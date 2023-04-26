import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree , Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardGuard implements CanActivate {
  constructor( private router:Router, private auth: LoginService ) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
          
      if (this.auth.isUserLoggedIn()){
        console.log(route.url);
        this.router.navigate(["garantia"]); 
        //alert('Usted ya esta autenticado en el sistema !!! '); 
        return false;
      } 
      return true;
  }
}
