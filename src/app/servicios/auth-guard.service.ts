import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot,RouterStateSnapshot } from '@angular/router';
import { LoginService } from './login.service';
 

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor( private router:Router , private auth: LoginService ) { }

  canActivate(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
      //alert(route.url);
    //check some condition  

    if (!this.auth.isUserLoggedIn() )  {
      console.log(route.url);
      alert('Usted no esta autenticado en el sistema !!! ');
      this.router.navigate(["garantia/Login"]);
      //this.router.navigate(["garantia/login"],{ queryParams: { retUrl: route.url} });
      //redirect to login/home page etc
      //return false to cancel the navigation
      //return false;
    } 
    return true; 
  }  

}
