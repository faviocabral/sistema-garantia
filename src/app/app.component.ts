import { Component, OnInit, AfterViewInit , OnDestroy} from '@angular/core';
import { Router, RouterStateSnapshot, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../app/servicios/auth.service';
import { MessagingService } from '../app/servicios/messaging.service';
import { NgxUiLoaderService, SPINNER } from 'ngx-ui-loader';
import firebase from 'firebase'
import { environment } from '../environments/environment';
import * as $ from '../../node_modules/jquery';

import '../../node_modules/@fortawesome/fontawesome-free/css/all.min.css';
import '../../node_modules/@fortawesome/fontawesome-free/js/all.min.js';
import '../../node_modules/admin-lte/dist/js/adminlte.min.js';
import '../../node_modules/admin-lte/dist/css/adminlte.min.css';

import * as moment from 'moment'; // add this 1 of 4
import * as Push from 'push.js';
import "../../node_modules/push.js/bin/push.min.js";
import "../../node_modules/push.js/bin/serviceWorker.min.js";

import { LoginService } from './servicios/login.service';
import { SwPush } from '@angular/service-worker'
import { WebsocketService } from 'src/app/servicios/websocket.service';
import { ConectadosService } from './servicios/conectados.service';
import { Subscription } from 'rxjs';

const publicVapidKey = 'BH2aGsR4IIyP1UWs-ERaFftJqLgKoF_eurAbzpOv2VYjydjgR5tQBIW6TcyAPAnLHv2nY4mGZ3hdV0hlZC6IGNg';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'garantia';
  message;
  mesaggeReceived = '';
  suscription : Subscription;
  constructor(
    private toastr: ToastrService,
    public loginInfo: AuthService,
    private router: Router,
    private websocket: WebsocketService,
    //private ngxService: NgxUiLoaderService, 
    private notificacion: MessagingService,
    private auth: LoginService,
    swPush: SwPush, 
    private conectados: ConectadosService
  ) {
    Push.default.config({ serviceWorker: '//serviceWorker.min.js'});

  }
  ngOnDestroy(){  
    this.suscription.unsubscribe(); 
  }

  ngOnInit() { 
    
    window.addEventListener("beforeunload", (e) =>{
      this.websocket.emit('cancelar-solicitud', { usuario: localStorage.getItem('nombre') ,user: localStorage.getItem('user') });
    })

    //window.onbeforeunload = () => {
    //  this.websocket.emit('cancelar-solicitud', { usuario: localStorage.getItem('nombre') ,user: localStorage.getItem('user') });
    //}
    
    this.conectados.online();
    this.menu();

    $( document ).ready(function() {
      $('#usuario-top').html(String( localStorage.getItem('nombre')).toUpperCase());
      console.log( "window loaded" );
      if(String( localStorage.getItem('area')).toUpperCase() == 'JEFE GRUPO' ){
        $(".admin").css('display', 'none');
      }
      if(String( localStorage.getItem('area')).toUpperCase() == 'REPUESTO' || String( localStorage.getItem('area')).toUpperCase() == 'GARANTIA' ){
        $(".crear-solicitud").css('display', 'none');
      }
      if(String( localStorage.getItem('area')).toUpperCase() !== 'ADMINISTRADOR' ){
        $(".user").css('display', 'none');
      }

    }); 

    this.suscription = this.websocket.listen('refrescar-pendientes').subscribe((data: any) => {
      //este mensaje es especifico a una persona cuando es el que solicito 
      if(localStorage.getItem('area') == 'JEFE GRUPO'){
        if(localStorage.getItem('user') == data.para){
          //this.pendientes();
          console.log('ingreso ini 1 pendiente para actualizar !!! ' , data);
          this.toastr.success('', data.mensaje);
          this.websocket.telegram(localStorage.getItem('chat_id'), data.mensaje);
        }
      }else{
        //estos mensajes son grupales .. 
        if(localStorage.getItem('area')== 'GARANTIA' &&  data.area == 'GARANTIA'){
          //this.pendientes();
          console.log('ingreso ini 2 pendiente para actualizar !!! ' , data);
          this.toastr.success('', data.mensaje);
          this.websocket.telegram(localStorage.getItem('chat_id'), data.mensaje);

        }else if(localStorage.getItem('area')== 'JEFE TALLER' && ( data.area == 'TALLER' || data.area == 'SOLICITUD' ) ){
          //this.pendientes();
          console.log('ingreso ini 2 pendiente para actualizar !!! ' , data);
          this.toastr.success('', data.mensaje);
          this.websocket.telegram(localStorage.getItem('chat_id'), data.mensaje);

        }else if(localStorage.getItem('area')== 'REPUESTO' && data.area == 'REPUESTO'){
          //this.pendientes();
          console.log('ingreso ini 2 pendiente para actualizar !!! ' , data);
          this.toastr.success('', data.mensaje);
          this.websocket.telegram(localStorage.getItem('chat_id'), data.mensaje);          
        }
      }

    })


  }

  showSuccess() {

  }

  isCollapsed: boolean = false;
  //currentUser: User;
  userlogin: boolean = false;


  sidebar() {

    if (document.body.classList.contains('sidebar-collapse')) {
      document.body.classList.remove('sidebar-collapse');
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
      document.body.classList.add('sidebar-collapse');
    }
  }

  sidebarMini() {
    if(window.innerWidth <= 990){
      if (document.body.classList.contains('sidebar-collapse')) {
        document.body.classList.remove('sidebar-collapse');
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
        document.body.classList.add('sidebar-collapse');
      }
    }
  }


  logout() {
    this.auth.logoutUser();
    this.loginInfo.loginInfo2 = false;
    this.router.navigate(['garantia/Login']);

  }

  menu(){
    if(String( localStorage.getItem('area')).toUpperCase() == 'JEFE GRUPO' ){
      $(".admin").css('display', 'none');
    }

  }
}
