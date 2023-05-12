import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GarantiaGuard implements CanActivate {
  constructor( private router:Router ) { }
  canActivate(
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      if(localStorage.getItem('area') !== 'JEFE GRUPO' && localStorage.getItem('area') !== 'ADMINISTRADOR' && localStorage.getItem('area') !== 'GARANTIA' ){
        this.router.navigate(['garantia/Pendientes']);
        //return false;
      }

    return true;
  }
  
}
