import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { WebsocketService } from 'src/app/servicios/websocket.service';
import swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SolicitudGuard implements CanActivate {
  constructor( private router:Router, private websocket: WebsocketService ) { }
  suscription : Subscription;
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      //console.log(route.url[2]['path'] );
      this.websocket.emit('solicitando', { usuario: localStorage.getItem('nombre'), user: localStorage.getItem('user'), orden : route.url[2]['path'] });
      return true;
  }
  
}
