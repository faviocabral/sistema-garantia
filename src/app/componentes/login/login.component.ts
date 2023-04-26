import { Component, OnInit } from '@angular/core';
import {AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { NgxUiLoaderService, SPINNER } from 'ngx-ui-loader';
import * as $ from '../../../../node_modules/jquery';
import * as moment from 'moment'; // add this 1 of 4
import * as io from 'socket.io-client';
import swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MessagingService } from '../../servicios/messaging.service';
import { LoginService } from 'src/app/servicios/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  Islogin;
  spinnerType = SPINNER.squareJellyBox;
  constructor(private loginINfo: AuthService , private router: Router , private auth: LoginService ) { }
  ngOnInit() {
    this.Islogin= 0; 
    //this.loginINfo.loginInfo2 = false;

    setTimeout(() => this.loginINfo.loginInfo2 = false );
    //asyncFunctionCall().then(res => { this.loginINfo.loginInfo2 = false; })    
  }

  login() {
    var usuario = "" , pass = "" , otros = "";
    usuario = $("#usuario").val().trim();
    pass    = $("#pass").val().trim();
    console.log('valor de usuario... ', usuario.length);
    console.log('valor de usuario... ', pass.length);
    if(usuario.length == 0 || pass.length == 0 ){
      swal.fire('Atencion', 'Ingrese usuario o password !!!', 'warning');
      return ;
    }

    let promesa = new Promise( (resolve, reject )=> {
      var servidor = window.location.origin;
      if (servidor.indexOf('localhost') >0 ){
        var url = "http://192.168.10.54:3010/garantia-login?usuario=" + usuario + "&pass=" + pass; 
      }else{
        var url = servidor + "/garantia-login?usuario=" + usuario + "&pass=" + pass; 
      }
      $.get(url, function (data, status) { 
        console.log(data['rows'].length); 
        var datos = data['rows']; 
        if (datos.length > 0) { 
          console.log('estado de la consulta ', status); 
          console.log(data); 
          resolve(data);

        }else{
          swal.fire('Atencion', 'No existen registros de usuario !!! ', 'warning');
          reject('error');
        }

      })
      .fail((err) => {
        reject('error');
        //this.spinner(0); 
        swal.fire('Atencion', 'Hubo un error en la consulta ' + err , 'error'); 
        console.error('hubo un error al traer los datos.. ' , err ); 
      }); 
    }); 

    promesa.then((data)=>{
      var usuario = data['rows'][0]['usuario'];
      var nombre = data['rows'][0]['nombre'];
      var area = data['rows'][0]['perfil'];
      var chat_id = data['rows'][0]['chat_id'];
      this.auth.login(usuario,area, nombre , chat_id );
    })  
    .then(()=> {
      //this.router.navigate(['garantia/Pendientes']);
    })  
    .then(()=>{
      location.reload()
    })
    .catch((error)=>{
      ///alert('hubo un error en la consulta' +  error );
      console.log(error);
    })

  }
}
