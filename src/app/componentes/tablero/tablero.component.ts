import { Component, OnInit,ElementRef, Renderer2, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as $ from '../../../../node_modules/jquery';
import * as moment from 'moment'; // add this 1 of 4
import * as io from 'socket.io-client';
import * as Push from 'push.js';

import swal from'sweetalert2';
import { AuthService } from '../../servicios/auth.service';
import { ToastrService } from 'ngx-toastr';
import '../../../../node_modules/jquery-ui-dist/jquery-ui.min.js';
import '../../../../node_modules/jquery-ui-dist/jquery-ui.min.css';

import { NgxUiLoaderService, SPINNER } from 'ngx-ui-loader';
import { WebsocketService } from 'src/app/servicios/websocket.service';
import {ActivatedRoute, Params, Router} from '@angular/router'
import { SortTableService } from 'src/app/servicios/sort-table.service';
import { MessagingService } from '../../servicios/messaging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.component.html',
  styleUrls: ['./tablero.component.css'], 
  //providers:[SocketService]
})

export class TableroComponent implements OnInit {
  private socket: any;
  public data: any;  
  public _ot: any[] =[];
  suscription : Subscription;

  constructor(
              private toastr: ToastrService, 
              private loginInfo : AuthService, 
              private router: Router, 
              private websocket : WebsocketService, 
              //private elRef:ElementRef,
              private ren2: Renderer2, 
              private orden: SortTableService,
              private notificacion: MessagingService

              ) {

            }

  showLoading = function() {
    swal.fire({
        title: 'Please Wait',
        allowEscapeKey: false,
        allowOutsideClick: false,
        background: '#19191a',
        showConfirmButton: false,
        onOpen: ()=>{
            swal.showLoading();
        }
        // timer: 3000,
        // timerProgressBar: true
    });
   
};

ngOnDestroy(){ 
  //this.suscription.unsubscribe(); 
}

  ngOnInit() {
    console.log( moment().format("yyyyMM01"));
    //caso que se modifique el tamaño de la ventana... 
    window.onresize = () =>{
      $('#pantalla').height(window.innerHeight - 65 );
    }
    $('#pantalla').height(window.innerHeight - 65 );


    $(".dropdown-menu").click(function(e){
      e.stopPropagation();
   })
  
    //$("#fechai").val(moment().format("yyyy-MM-01"));
    //$("#fechaf").val(moment().format("yyyy-MM-DD"));
   //console.log('estado de loginINfo2 ', this.loginInfo.loginInfo2);

    if(this.loginInfo.loginInfo2 = false){
      this.router.navigate(['garantia/Login']); 
    }

      this.buscar();
   
    this.loginInfo.loginInfo2 = true;
    console.log(this.loginInfo.loginInfo2);
    const Toast = swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      showCloseButton: true,
      //timer: 1200,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', swal.stopTimer)
        toast.addEventListener('mouseleave', swal.resumeTimer)
      }

    });
    //this.showSuccess();

  }


  spinner(e){
    if (e == 1 ){
      this.showLoading();  
    }else{
      swal.close();
    }
  }


  oheka(id) {
    if(id == 0 ){ // limpiar datos 
      $("tbody tr").show();
      $('#filtrados').html("0");
      return ;
    }

    var texto = $("#buscar").val();
    if (texto.length == 0 ){

      if($('tbody >tr:visible').length == $('tbody >tr').length ){
        this.toastr.warning('Ingrese algun valor de busqueda.','ATENCION!');
        return;
      }
      //$("tbody tr").show();

    }else{
      $("tbody tr").not(':contains("'+ texto.toUpperCase() +'")').hide();
    }
    $('#filtrados').html($('tbody >tr:visible').length);
    this.toastr.success( $('tbody >tr:visible').length + ' registros filtrados..')
    console.log( $('tbody >tr:visible').length)
  }


  ordenar(){
    
    //https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_table_number
    //https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_table_desc
    //https://www.w3schools.com/howto/howto_js_sort_table.asp
    //<i class="fa fa-sort-amount-desc" aria-hidden="true"></i>
    //<i class="fa fa-sort-amount-asc" aria-hidden="true"></i>

  }

  buscar(){
    this.spinner(1); 
    var fechai = moment().format("yyyyMM01");   //$("#fechai").val().replaceAll("-", ""); 
    var fechaf = moment().format("yyyyMMDD");   //$("#fechaf").val().replaceAll("-", ""); 
    var ot = "0", url;
    if( $("#buscarOt").val().length > 0 ){
      ot = $("#buscarOt").val();
      $("#buscarOt").val('');
    }
    var servidor = window.location.origin;
    if (servidor.indexOf('localhost') >0 ){
      url = "http://192.168.10.54:3010/garantia-tablero?fechai="+ fechai + "&fechaf=" + fechaf + "&ot=" + ot; 
    }else{
      url = servidor + "/garantia-tablero?fechai="+ fechai + "&fechaf=" + fechaf + "&ot=" + ot; 
    }
 
    $.get(url, function(data, status){
      console.log('estado de la consulta ', status );
    })
    .done((rs)=>{
      console.log(rs['rows'].length);
      if(rs['rows'].length == 0 ){
        swal.fire('No existen registros !!', '', 'warning');
        return;
      }

      this.spinner(0);
      $('#cab > *').remove(); //fco vacia el body de la tabla 
      $('#det > *').remove(); //fco vacia el body de la tabla 
      var listado = Object.values(rs); 
      var cab = Object.keys(listado[0][0]); 
      var registro = Object.keys(listado[0]); 
      var body = '' , head = '' , orden: any, valor:any ; 
      console.log('total registros   ' , registro.length); 
      for (let index = 0; index < registro.length ; index++) { 
        body += '<tr>'; 
        body += '<td class="pl-2" id="OT'+ listado[0][index][ cab[0] ] +'" ></td>'; 
        this._ot.push(listado[0][index][ 'ot' ]); 
        for(let x = 0; x < cab.length; x++){ 
          if(!listado[0][index][ cab[x] ]){ 
            valor = ''; 
            orden = 0 ; 
          }else{
             valor = listado[0][index][ cab[x] ]; 
             if(Number.isInteger( Number.parseInt( valor.toString().replaceAll('-', ''))) ){
              orden = Number.parseInt( valor.toString().replaceAll('-', ''));
            }else{
              orden = valor.toString().charCodeAt(0);
            }
          }
          //filtrar campos que no queremos mostar en el detalle .. 
          if(cab[x] != 'solicitud'){
            body += '<td style="vertical-align:middle" orden='+ orden +'>' + valor + '</td>'; 
          }
        }
        body += '</tr>'; 
      }
      head += '<tr style="color:white;">'; 
      head += '<th style="background-color:#dc3545; text-align:center; padding-left:2px; font-size:18px; border-right: 1px solid white;">#</th>'; 
      for (let index = 0; index < cab.length; index++) {
        if(cab[index] != 'solicitud'){// filtramos campos que no queremos mostar en el detalle .. 
          head += '<th style="background-color:#dc3545; padding-top:auto;paddgin-bottom:auto; border-right: 1px solid white;" id="'+ cab[index] +'" >' + cab[index] + '</th>'; 
        }
      }
      head += '</tr>';

      var htmlHead = head; //$.parseHTML( head );
      var htmlBody = body; //$.parseHTML( body );
      $("#cant-registros").html(registro.length); 

      document.querySelector('#cab').innerHTML= htmlHead ; 
      document.querySelector('#det').innerHTML= htmlBody ; 
      var button, orden; 

      for (let index = 0; index < registro.length ; index++) { 

        orden = listado[0][index][ 'OT' ]; 
        button = document.createElement('button'); 
        if(listado[0][index][ 'solicitud' ] == '1' ){
          button.innerHTML= '<i class="fa fa-exclamation fa-lg" aria-hidden="true"></i>'; 
          button.className = 'btn btn-warning btn-sm btn-block'; 

        }else{
          button.innerHTML= '<i class="fa fa-plus fa-lg" aria-hidden="true"></i>'; 
          button.className = 'btn btn-info btn-sm btn-block'; 
        }
        button.setAttribute('id','BT'+ orden); 
        document.getElementById('OT'+ orden ).append( button ); 
        document.getElementById('BT'+ orden ).addEventListener('click',()=>{ this.solicitar(listado[0][index][ 'OT' ] ); }); 
      }

      for (let index = 0; index < cab.length; index++) { 
        //console.log(cab[index]); 
        if(cab[index] != 'solicitud'){
          document.getElementById( cab[index] ).addEventListener('click',()=>{ this.orden.sort(index + 1); }); 
        }
      } 

    })
    .fail(()=>{
      this.spinner(0);
      console.error('hubo un error al traer los datos.. ');
    });
  }

  solicitar(ot){
   // this.notificacion.sendPush('Garantia', 'Nueva Solicitud !!!');
    //https://www.samjulien.com/how-to-use-route-parameters-in-angular
    //https://www.concretepage.com/angular-2/angular-4-renderer2-example#parentNode
    var promesa = new Promise((resolve , reject )=>{

      var servidor = window.location.origin;
      if (servidor.indexOf('localhost') >0 ){
        var url = "http://192.168.10.54:3010/garantia-existeSol?ot="+ ot; 
      }else{
        var url = servidor + "/garantia-existeSol?ot="+ ot; 
      }
   
      $.get(url, function(data, status){
        //console.log('estado de la consulta ', status );
      })
      .done((rs)=>{
        console.log('resultado de ... ' , rs['rows']);
        if(rs['rows'].length ==0 ){
          resolve(0);

        }else {
          if(rs['rows'][0]['usuario'] == localStorage.getItem('user') ){
            //swal.fire('No existen registros !!', '', 'warning');
            resolve(0);
          }else{
            resolve(0)
            //swal.fire('La orden Nro '+ ot +' ya tiene Solicitud creada por '+ rs['rows'][0]['usuario'] +' !!', '', 'warning');
            //reject(1);
          }
        }

      });

    })
    .then(value=>{ 
      //para saber quien esta creando una solicitud no se pueda crear hasta que termine o libere... 
      this.websocket.emit('solicitando', { usuario: localStorage.getItem('nombre'), user: localStorage.getItem('user') , orden : ot });
      this.router.navigate(['garantia/Solicitud', ot]); 
    })

  }

  existeSol(ot){

    var servidor = window.location.origin;
    if (servidor.indexOf('localhost') >0 ){
      var url = "http://192.168.10.54:3010/garantia-existeSol?ot="+ ot; 
    }else{
      var url = servidor + "/garantia-existeSol?ot="+ ot; 
    }
 
    $.get(url, function(data, status){
      console.log('estado de la consulta ', status );
    })
    .done((rs)=>{
      console.log(rs['rows'].length);
      if(rs['rows'].length == 0 ){
        //swal.fire('No existen registros !!', '', 'warning');
        return 0;
      }else{
        swal.fire('La orden Nro '+ ot +' ya tiene Solicitud !!', '', 'warning');
        return 1;
      }
    });
  }

}
