import { Component, OnInit,AfterViewInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../servicios/auth.service'
import * as $ from '../../../../node_modules/jquery';
import * as moment from 'moment'; // add this 1 of 4
import * as io from 'socket.io-client';

import swal from'sweetalert2';
import { Toast, ToastrService } from 'ngx-toastr';
import { WebsocketService } from 'src/app/servicios/websocket.service';
import {ActivatedRoute, Params, Router} from '@angular/router'
import { SortTableService } from 'src/app/servicios/sort-table.service';
import { MessagingService } from '../../servicios/messaging.service';
import { resolve } from 'dns';
import { rejects } from 'assert';
import { ThisReceiver } from '@angular/compiler';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pendientes',
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css']
})
export class PendientesComponent implements OnInit,AfterViewInit, OnDestroy {
  suscription : Subscription;

  constructor(private loginInfo: AuthService, private router: Router,private websocket: WebsocketService,private toastr: ToastrService ) {

   }
   ngOnDestroy(){ 
    this.suscription.unsubscribe(); 
    }
  ngOnInit() { 
    this.suscription = this.websocket.listen('refrescar-pendientes').subscribe((data: any) => {
      this.pendientes();
    })

    this.pendientes();
    //para evitar recargar la pagina... del buscador de ot ... 
    $('#formBuscar').on('submit', function(e){
      e.preventDefault();
    })

    //caso que se modifique el tamaño de la ventana... 
    window.onresize = () =>{
      $('#pendientes').height(window.innerHeight - 215 );
    }
    $('#pendientes').height(window.innerHeight - 215 );
    

  }

  ngAfterViewInit(){
    
  }

  pendientes(){
    var promesa = new Promise((resolve , reject)=>{
      this.buscar(0); // si es 0 trae todo el contenido 
      resolve(1);
    })
    .then((value)=>{
      setTimeout(() => {
        this.controles();
      }, 500);
    })
      
  }

  buscarOT(accion){
    if(accion == 1 ){
      if($("#buscar").val().length == 0 ){
        swal.fire('Ingrese algun valor para la busqueda !!!');
        return;
      }
      this.buscar($("#buscar").val());
    }else{
      this.buscar(0);
      $("#buscar").val('');
    }
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

  spinner(e){
    if (e == 1 ){
      this.showLoading();  
    }else{
      swal.close();
    }
  }

  controles(){
      if( String( localStorage.getItem('area')).toUpperCase() == 'JEFE GRUPO' ){
        $(".admin").css('display', 'none');
      } 

      if( String( localStorage.getItem('area')).toUpperCase() == 'GARANTIA' ){
        $(".taller").css('display', 'none');
        $(".repuesto").css('display', 'none');
      } 
      if( String( localStorage.getItem('area')).toUpperCase() == 'REPUESTO' ){
        $(".taller").css('display', 'none');
        $(".garantia").css('display', 'none');
      } 
      if( String( localStorage.getItem('area')).toUpperCase() == 'JEFE TALLER' ){
        $(".garantia").css('display', 'none');
        $(".repuesto").css('display', 'none');
      } 
    }

  buscar(ot){
    var promesa = new Promise((resolve , reject)=>{
      this.spinner(1); 
      //var fechai = $("#fechai").val().replaceAll("-", ""); 
      //var fechaf = $("#fechaf").val().replaceAll("-", ""); 
      var usuario = localStorage.getItem('user');
      var area = localStorage.getItem('area');
      var servidor = window.location.origin;
      var url = "" ;
      if (servidor.indexOf('localhost') >0 ){
        url = "http://192.168.10.54:3010/garantia-solicitudes?ot=" + ot +"&usuario="+ usuario +"&area="+ area ;
      }else{
        url = servidor + "/garantia-solicitudes?ot=" + ot +"&usuario="+ usuario +"&area="+ area ; 
      }
      $.get(url, function(data, status){
        console.log('estado de la consulta ', status );
      })
      .done((rs)=>{
        this.spinner(0); 
        console.log(rs['rows']);
        if(rs['rows'].length == 0 ){
          swal.fire('No existen registros !!', '', 'warning');
          return ;
        }
        $('#cab > *').remove(); //fco vacia el body de la tabla 
        $('#det > *').remove(); //fco vacia el body de la tabla 
        var listado = Object.values(rs); 
        var cab = Object.keys(listado[0][0]); 
        var registro = Object.keys(listado[0]); 
        var body = '' , head = '' , orden: any, valor:any , subTable = '' , totalSol = 0 , totalTaller =0 , totalGarantia=0 , totalRepuesto=0 ; 
        console.log('total registros   ' , registro.length); 
  
        //armar el detalle de la tablla 
        for (let index = 0; index < registro.length ; index++) { 
          
          //subtable para mostrar el detalle de la solicitud 
          // fila trae orden asc del detalle y fila2 trae orden desc del detalle para saber cuando empieza y cuando termina una ot con su detalle.. 
          if ( listado[0][index]['fila'] == 1 ){ // primera fila del detalle carga el primer bloque con el primer registro ... 
            //contabilizar para el dashboard... 
            if(listado[0][index]['area'] == 'SOLICITUD'){ totalSol++ ; }
            if(listado[0][index]['area'] == 'TALLER'){ totalTaller++ ; }
            if(listado[0][index]['area'] == 'GARANTIA'){ totalGarantia++ ; }
            if(listado[0][index]['area'] == 'REPUESTO'){ totalRepuesto++ ; }
            
            //en esta variable se carga el detalle... 
            subTable = 
            '<tr id="T'+ (index +1) +'" style="display:none;">'+ 
              '<td colspan="'+ (cab.length + 1) +'" class="pl-5">'+ 
            '<table id="TD'+ listado[0][index]['id'] +'" class="table table-sm table-head-fixed text-nowrap m-0 ">'+ 
                //cabecera 
                '<tr class="bg-info">'+ 
                  '<th class="border border-white" style="width:10px;">Item</th>'+ 
                  '<th class="border border-white" style="width:50px;">Estado</th>'+ 
                  '<th class="border border-white">Incidente</th>'+ 
                  '<th class="border border-white">Pieza Causal</th>'+ 
                  '<th class="border border-white">Repuesto</th>'+ 
                  '<th class="border border-white">Motivo</th>'+ 
                  '<th class="border border-white">Reparacion</th>'+ 
                '</tr>'+ 
                //detalle 
                '<tr>'+ 
                  '<td><span class="badge badge-dark">'+ listado[0][index]['fila'] +'</span></td>';
                  if(listado[0][index]['estado2'] == "APROBADO"){
                    subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-success">'+ listado[0][index]['estado2'] +'</span></td>';
                  }else if(listado[0][index]['estado2'] == "RECHAZADO"){
                    subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-danger">'+ listado[0][index]['estado2'] +'</span></td>';
                  }else if(listado[0][index]['estado2'] == "ESPERA"){
                    subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-warning">'+ listado[0][index]['estado2'] +'</span></td>';
                  }else if(listado[0][index]['estado2'] == "MODIFICADO"){
                    subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-warning">'+ listado[0][index]['estado2'] +'</span></td>';
                  }else if(listado[0][index]['estado2'] == "ENTREGADO"){
                    subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-success">'+ listado[0][index]['estado2'] +'</span></td>';
                  }else{
                    subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-info">'+ listado[0][index]['estado2'] +'</span></td>';
                  }
                  subTable +='<td>'+ (listado[0][index]['incidente'] ?? '') +'</td>'+
                  '<td>'+ (listado[0][index]['piezaCausal'] ?? '-') +'</td>'+
                  '<td>'+ listado[0][index]['repuesto'] +'</td>'+
                  '<td>'+ listado[0][index]['motivo'] +'</td>'+
                  '<td>'+ listado[0][index]['reparacion'] +'</td>'+
                '</tr>';
    
          }else { //si no es fila uno 
            //siguiente detalles .. 
            subTable += '<tr>'+
                          '<td><span class="badge badge-dark">'+ listado[0][index]['fila'] +'</span></td>';
                          if(listado[0][index]['estado2'] == "APROBADO"){
                            subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-success">'+ listado[0][index]['estado2'] +'</span></td>';
                          }else if(listado[0][index]['estado2'] == "RECHAZADO"){
                            subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-danger">'+ listado[0][index]['estado2'] +'</span></td>';
                          }else if(listado[0][index]['estado2'] == "ESPERA"){
                            subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-warning">'+ listado[0][index]['estado2'] +'</span></td>';
                          }else if(listado[0][index]['estado2'] == "MODIFICADO"){
                            subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-warning">'+ listado[0][index]['estado2'] +'</span></td>';
                          }else if(listado[0][index]['estado2'] == "ENTREGADO"){
                            subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-success">'+ listado[0][index]['estado2'] +'</span></td>';
                          }else{
                            subTable += '<td id="D'+ listado[0][index]['id'] + listado[0][index]['fila'] +'" valor="'+ listado[0][index]['estado2'] +'" idDet="'+ listado[0][index]['idDet'] +'"><span class="badge badge-info">'+ listado[0][index]['estado2'] +'</span></td>';
                          }
                          subTable +='<td>'+ (listado[0][index]['incidente'] ?? '') +'</td>'+
                          '<td>'+ (listado[0][index]['piezaCausal'] ?? '-') +'</td>'+
                          '<td>'+ listado[0][index]['repuesto'] +'</td>'+
                          '<td>'+ listado[0][index]['motivo'] +'</td>'+
                          '<td>'+ listado[0][index]['reparacion'] +'</td>'+
                        '</tr>'; 
          }
          //cuando llegue a la ultima fila del detalle cierra el bloque 
          if(listado[0][index]['fila2'] == 1){
            subTable += 
              '</table>'+
                '<div class="d-flex mt-3">'+
                  '<div class="flex-fill admin taller" id="boxTa'+ listado[0][index]['ot'] +'" >'+
                    // mas abajo se agrega los botones de aprobar y rechazar 
                    '<p class="mt-1 pl-5 h4"><strong>Jefe Taller</strong></p>'+
                  '</div>'+
                  '<div class="flex-fill admin garantia " id="boxGar'+ listado[0][index]['ot'] +'" >'+
                    // mas abajo se agrega los botones de aprobar y rechazar 
                    '<p class="mt-1 pl-5 h4"><strong>Jefe Garantia</strong></p>'+
                  '</div>'+
                  '<div class="flex-fill admin repuesto " id="boxRep'+ listado[0][index]['ot'] +'" >'+
                    // mas abajo se agrega los botones de aprobar y rechazar 
                    '<p class="mt-1 pl-0 h4"><strong>Jefe Repuesto</strong></p>'+
                  '</div>'+
                '</div>'+
              '</td>'+ 
            '</tr>'; 
          }
  
          body += '<tr id="F'+ (index + 1 ) +'">'; 
          //solo la fila 1 carga la fila.. 
          //para agregar los botones primarios... 
          if(listado[0][index]['fila'] == 1){ 
            body += '<td class="pl-2" id="OT'+ listado[0][index][ 'ot' ] +'" ></td>'; 
            body += '<td class="" id="LOG'+ listado[0][index][ 'nro' ] +'" ></td>'; 
            
          } //boton del detalle . 
  
          for(let x = 0; x < cab.length; x++){ 
            //solo fila 1 carga y que no sean del detalle repuesto y motivo .. 
            if(listado[0][index]['fila'] == 1 && cab[x] != 'repuesto' && cab[x] != 'motivo' && cab[x] != 'reparacion' && cab[x] != 'fila' && cab[x] != 'fila2' && cab[x] != 'id' && cab[x] != 'estado2' && cab[x] != 'idDet' && cab[x] != 'piezaCausal' && cab[x] != 'incidente' ){
              if(cab[x] == 'estado'){
                if(listado[0][index][ cab[x] ] == 'APROBADO'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-success w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'RECHAZADO'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-danger w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'ESPERA'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-warning w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'MODIFICADO'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-warning w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'PENDIENTE'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-warning w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'ENTREGADO'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-success w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else{
                  body += '<td style="vertical-align:middle"><span class="badge badge-info w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }
  
              }else if(cab[x] == 'vdn') {
                body += '<td style="vertical-align:middle"><span class="badge badge-dark" style="font-size:14px;">' + listado[0][index][ cab[x] ] + '</span></td>'; 
              }else if(cab[x] == 'nro') {//
                body += '<td style="vertical-align:middle" id="NRO'+ listado[0][index][ cab[x] ] +'"></td>'; 
  
              }else if(cab[x] == 'area') {
                //para pintar el mismo color de cada area 
                if(listado[0][index][ cab[x] ] == 'SOLICITUD'){
                  body += '<td style="vertical-align:middle"><span class="badge w-100" style="font-size:14px; background-color:#8fbc8f;">' + listado[0][index][ cab[x] ] + '</span></td>'; 
  
                }else if( listado[0][index][ cab[x] ] == 'TALLER' ){
                  body += '<td style="vertical-align:middle"><span class="badge w-100" style="font-size:14px; background-color:#daa520;">' + listado[0][index][ cab[x] ] + '</span></td>'; 
  
                }else if( listado[0][index][ cab[x] ] == 'GARANTIA' ){
                  body += '<td style="vertical-align:middle"><span class="badge w-100" style="font-size:14px; background-color:#87cefa;">' + listado[0][index][ cab[x] ] + '</span></td>'; 
  
                }else if( listado[0][index][ cab[x] ] == 'REPUESTO' ){
                  body += '<td style="vertical-align:middle"><span class="badge w-100" style="font-size:14px; background-color:#bc8f8f;">' + listado[0][index][ cab[x] ] + '</span></td>'; 
  
                }
  
              }else{
                body += '<td style="vertical-align:middle">' + listado[0][index][ cab[x] ] + '</td>'; 
              }
            }
          }
          body += '</tr>'; 
          //cuando termina el detalle de la solicitud agrega en la parte final ... 
          if(listado[0][index]['fila2'] == 1){body += subTable;}
          
        }
        //$('#totalSol').text(totalSol);
        //$('#totalTaller').text(totalTaller);
        //$('#totalGarantia').text(totalGarantia);
        //$('#totalRepuesto').text(totalRepuesto);
        //sapo
        
        head += '<tr style="color:white;">'; 
        head += '<th style="background-color:#dc3545; text-align:center; padding-left:2px; font-size:18px; border-right: 1px solid white;">#</th>'; //PARA VER EL DETALLE 
        head += '<th style="background-color:#dc3545; text-align:center; padding-left:2px; border-right: 1px solid white;">LOG</th>'; //PARA VER EL LOG 
        for (let index = 0; index < cab.length; index++) {
          //repuesto y motivo son del detalle 
          if(cab[index] != 'repuesto' && cab[index] != 'motivo' && cab[index] != 'reparacion' && cab[index] != 'fila' && cab[index] != 'fila2' && cab[index] != 'id' && cab[index] != 'estado2' && cab[index] != 'idDet'  && cab[index] != 'piezaCausal' && cab[index] != 'incidente' ){
            head += '<th style="background-color:#dc3545; padding-top:auto;paddgin-bottom:auto; border-right: 1px solid white;" id="'+ cab[index] +'">' + cab[index].toUpperCase() + '</th>'; 
          }
        }
        head += '</tr>'; 
  
        var htmlHead = head; //$.parseHTML( head );
        var htmlBody = body; //$.parseHTML( body );
        $("#cant-registros").html(registro.length); 
  
        document.querySelector('#cab').innerHTML= htmlHead ; 
        document.querySelector('#det').innerHTML= htmlBody ; 
  
  
        var button, button2, orden, check; 
        //para agregar eventos y efectos al detalle angular no actualiza al cargar se setea... 
        for (let index = 0; index < registro.length ; index++) { 
  
          if(listado[0][index]['fila'] == 1 ){// solo a la primera fila ... 
  
            orden = listado[0][index]['ot']; 
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-chevron-right fa-lg" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-info btn-sm'; 
            button.setAttribute('id','BT'+ orden); //asigar id al boton para luego agregar el evento click.. 
            document.getElementById('OT'+ orden ).append( button ); //se agrega el boton a la linea... 
            document.getElementById('BT'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              if ( $("#T"+(index + 1)).css('display') == 'none'){ //mostrar detalle.. 
                $("#T"+(index + 1)).css('display', 'table-row'); 
              }else { //ocultar detalle.. 
                $("#T"+(index + 1)).css('display', 'none'); 
              } 
            }); 
  
            /* area de volver a la solicitud para consultar o modificar  */
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<strong>' + listado[0][index]['nro'] + '</strong> <i class="fa fa-share" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-info btn-sm'; 
            button.setAttribute('id','BNRO'+ listado[0][index]['nro']); //asigar id al boton para luego agregar el evento click.. 
            document.getElementById('NRO'+ listado[0][index]['nro'] ).append( button ); //se agrega el boton a la linea... 
            document.getElementById('BNRO'+ listado[0][index]['nro'] ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.solicitar(listado[0][index]['ot']);
            }); 
  
            /* area de Log  */
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '</strong> <i class="fa fa-clock" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-warning btn-sm ml-2'; 
            button.setAttribute('id','BLOG'+ listado[0][index]['nro']); //asigar id al boton para luego agregar el evento click.. 
            document.getElementById('LOG'+ listado[0][index]['nro'] ).append( button ); //se agrega el boton a la linea... 
            document.getElementById('BLOG'+ listado[0][index]['nro'] ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.log(listado[0][index]['nro']);
            }); 
  
            /* agregar boton para jefe taller */ 
            /*aprobar*/
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-thumbs-up" aria-hidden="true"></i> Aprobar'; //icono.. 
            button.className = 'btn btn-success'; 
            button.setAttribute('id','BTA'+ orden); //asigar id al boton para luego agregar el evento click.. 
            if(
              ( listado[0][index]['area'] == 'TALLER'  && listado[0][index]['estado'] == 'APROBADO') ||
              listado[0][index]['area'] == 'GARANTIA'  || listado[0][index]['area'] == 'REPUESTO'
              ){ button.disabled = true; } 
            document.getElementById('boxTa'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BTA'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'TALLER', listado[0][index]['id'] , 'APROBADO', listado[0][index]['usuario'] , orden );
            }); 
  
            /*PENDIENTE  pendiente de carga o modificacion */
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-clock" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-warning mr-2'; 
            button.setAttribute('id','BTP'+ orden); //asigar id al boton para luego agregar el evento click.. 
            /*
            if(
              ( listado[0][index]['area'] == 'TALLER'  && listado[0][index]['estado'] == 'APROBADO') ||
              listado[0][index]['area'] == 'GARANTIA'  || listado[0][index]['area'] == 'REPUESTO'
              ){ button.disabled = true; } 
            */
            document.getElementById('boxTa'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BTP'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'TALLER', listado[0][index]['id'] , 'PENDIENTE', listado[0][index]['usuario'], orden );
            }); 
  
            /*rechazar*/
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-thumbs-down" aria-hidden="true"></i> Rechazar'; //icono.. 
            button.className = 'btn btn-danger mr-2'; 
            button.setAttribute('id','BTR'+ orden); //asigar id al boton para luego agregar el evento click.. 
            if(
              ( listado[0][index]['area'] == 'TALLER'  && listado[0][index]['estado'] == 'APROBADO') ||
              listado[0][index]['area'] == 'GARANTIA'  || listado[0][index]['area'] == 'REPUESTO'
              ){ button.disabled = true; } 
            document.getElementById('boxTa'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BTR'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'TALLER', listado[0][index]['id'] , 'RECHAZADO', listado[0][index]['usuario'], orden );
            }); 
  
            /* agregar boton para jefe garantia */ 
            /*aprobar*/
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-thumbs-up" aria-hidden="true"></i> Aprobar'; //icono.. 
            button.className = 'btn btn-success'; 
            button.setAttribute('id','BGP'+ orden); //asigar id al boton para luego agregar el evento click.. 
            if(
              ( listado[0][index]['area'] == 'TALLER'  && ( listado[0][index]['estado'] == 'RECHAZADO' || listado[0][index]['estado'] == 'PENDIENTE'|| listado[0][index]['estado'] == 'MODIFICADO' )) ||
              ( listado[0][index]['area'] == 'GARANTIA'  && listado[0][index]['estado'] == 'APROBADO') ||
              listado[0][index]['area'] == 'REPUESTO' || listado[0][index]['area'] == 'SOLICITUD'  
              ){ button.disabled = true; } 
            document.getElementById('boxGar'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BGP'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'GARANTIA', listado[0][index]['id'] , 'APROBADO', listado[0][index]['usuario'], orden );
            }); 
  
            /*pendiente  pendiente de carga o modificacion ... */
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-clock" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-warning mr-2'; 
            button.setAttribute('id','BGA'+ orden); //asigar id al boton para luego agregar el evento click.. 
            /*
            if(
              ( listado[0][index]['area'] == 'TALLER'  && ( listado[0][index]['estado'] == 'RECHAZADO' || listado[0][index]['estado'] == 'PENDIENTE' || listado[0][index]['estado'] == 'MODIFICADO' )) ||
              ( listado[0][index]['area'] == 'GARANTIA'  && listado[0][index]['estado'] == 'APROBADO') ||
              listado[0][index]['area'] == 'REPUESTO' || listado[0][index]['area'] == 'SOLICITUD'  
              ){ button.disabled = true; }
              */ 
            document.getElementById('boxGar'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BGA'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'GARANTIA', listado[0][index]['id'] , 'PENDIENTE', listado[0][index]['usuario'], orden );
            }); 
            /*rechazar*/
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-thumbs-down" aria-hidden="true"></i> Rechazar'; //icono.. 
            button.className = 'btn btn-danger mr-2'; 
            button.setAttribute('id','BGR'+ orden); //asigar id al boton para luego agregar el evento click.. 
            if(
              ( listado[0][index]['area'] == 'TALLER'  && ( listado[0][index]['estado'] == 'RECHAZADO' || listado[0][index]['estado'] == 'PENDIENTE' || listado[0][index]['estado'] == 'MODIFICADO')) ||
              ( listado[0][index]['area'] == 'GARANTIA'  && listado[0][index]['estado'] == 'APROBADO')  ||
              listado[0][index]['area'] == 'REPUESTO' || listado[0][index]['area'] == 'SOLICITUD'  
              ){ button.disabled = true; } 
            document.getElementById('boxGar'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BGR'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'GARANTIA', listado[0][index]['id'] , 'RECHAZADO', listado[0][index]['usuario'], orden );
            }); 
  
            /* agregar boton para Repuesto */ 
            /*entregar*/
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-thumbs-up" aria-hidden="true"></i> Entregar'; //icono.. 
            button.className = 'btn btn-success'; 
            button.setAttribute('id','BREN'+ orden); //asigar id al boton para luego agregar el evento click.. 
            if(
              ( listado[0][index]['area'] == 'GARANTIA'  && ( listado[0][index]['estado'] == 'RECHAZADO' || listado[0][index]['estado'] == 'PENDIENTE' || listado[0][index]['estado'] == 'MODIFICADO' ) ) ||
              ( listado[0][index]['area'] == 'REPUESTO'  && listado[0][index]['estado'] == 'ENTREGADO') ||
              listado[0][index]['area'] == 'TALLER'  || listado[0][index]['area'] == 'SOLICITUD'  
              ){ button.disabled = true; } 
            document.getElementById('boxRep'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BREN'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'REPUESTO', listado[0][index]['id'] , 'ENTREGADO', listado[0][index]['usuario'], orden );
            }); 
  
            /*en espera*/
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= '<i class="fa fa-hand-paper" aria-hidden="true"></i> En Espera'; //icono.. 
            button.className = 'btn btn-warning mr-2'; 
            button.setAttribute('id','BRES'+ orden); //asigar id al boton para luego agregar el evento click.. 
            if(
              ( listado[0][index]['area'] == 'GARANTIA'  && ( listado[0][index]['estado'] == 'RECHAZADO' || listado[0][index]['estado'] == 'PENDIENTE' || listado[0][index]['estado'] == 'MODIFICADO' )) ||
              ( listado[0][index]['area'] == 'REPUESTO'  && listado[0][index]['estado'] == 'ENTREGADO') ||
              listado[0][index]['area'] == 'TALLER' || listado[0][index]['area'] == 'SOLICITUD' 
              ){ button.disabled = true; } 
            document.getElementById('boxRep'+ orden ).prepend( button ); //se agrega el boton a la linea... 
            document.getElementById('BRES'+ orden ).addEventListener('click',()=>{ //se agrega el evento ... 
              this.aprobar( 'REPUESTO', listado[0][index]['id'] , 'ESPERA', listado[0][index]['usuario'], orden );
            }); 
  
          }
          //CUANDO RECHACE 
          document.getElementById('D'+ listado[0][index]['id']+listado[0][index]['fila'] ).addEventListener('click',()=>{ //se agrega el evento ... 
            if($("#D"+listado[0][index]['id']+listado[0][index]['fila']).attr('valor') == 'RECHAZADO') return ; // no se puede modificar cuando fue rechazado.. 
                      
            if(
              ( listado[0][index]['area'] == 'REPUESTO' && listado[0][index]['estado'] !== 'ENTREGADO') ||
              ( listado[0][index]['area'] == 'GARANTIA' && listado[0][index]['estado'] == 'APROBADO') 
               ){
              if ( $("#D"+listado[0][index]['id']+listado[0][index]['fila']).text() == 'ESPERA'){ //mostrar detalle.. 
                $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-success text-nowrap">ENTREGADO</span>'); 
              }else { //ocultar detalle.. 
                $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-warning">ESPERA</span>'); 
              } 
            }
            if(listado[0][index]['area'] == 'GARANTIA' && listado[0][index]['estado'] !== 'APROBADO' ){
              if(listado[0][index]['estado'] !== 'APROBADO'){
                if( $("#D"+listado[0][index]['id']+listado[0][index]['fila']).text() == 'APROBADO' ){ //mostrar detalle.. 
                  $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-danger text-nowrap">RECHAZADO</span>'); 
                }else { //ocultar detalle.. 
                  $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-success">APROBADO</span>'); 
                } 
              }else{
                if ( $("#D"+listado[0][index]['id']+listado[0][index]['fila']).text() == 'APROBADO' || $("#D"+listado[0][index]['id']+listado[0][index]['fila']).text() == 'ENTREGADO'){ //mostrar detalle.. 
                  $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-danger text-nowrap">ESPERA</span>'); 
                }else { //ocultar detalle.. 
                  $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-success">ENTREGADO</span>'); 
                } 
              }
  
            }else if(listado[0][index]['area'] == 'TALLER' || listado[0][index]['area'] == 'SOLICITUD' ){
  
              if ( $("#D"+listado[0][index]['id']+listado[0][index]['fila']).text() == 'APROBADO' || $("#D"+listado[0][index]['id']+listado[0][index]['fila']).text() == 'NUEVO' ){ //mostrar detalle.. 
                $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-danger text-nowrap">RECHAZADO</span>'); 
              }else { //ocultar detalle.. 
                $("#D"+listado[0][index]['id']+listado[0][index]['fila']).html('<span class="badge badge-success">APROBADO</span>'); 
              } 
            }
  
          }); 
  
        }
        resolve(1);
        //promesa
      })
      .fail((err) => {
        this.spinner(0); 
        swal.fire('Error en la consulta', err, 'warning');
      });
  
    })
    .then((value)=>{
      setTimeout(() => {
        this.controles();
      }, 500);
    })


  }
  solicitar(ot){
    this.websocket.emit('solicitud', { mensaje: 'El '+ localStorage.getItem('area') +' '+ localStorage.getItem('nombre') +' ha modificado una solicitud de la Nro OT '+ ot +' !!! ',para: localStorage.getItem('user') , area :  $('#area').val()});

    this.router.navigate(['garantia/Solicitud', ot]); 
  }

  log(solicitud){
    var url;
    var servidor = window.location.origin;    
    if (servidor.indexOf('localhost') >0 ){
      url = "http://192.168.10.54:3010/garantia-log?solicitud=" + solicitud ; 
    }else{
      url = servidor + "/garantia-log?solicitud=" + solicitud ;
    }
    
    $.get( url ) 
    .done(function( data ) { 
      console.log('datos del log: ');
      console.log(data['rows'][0]['fecha']); 
      //swal.fire('Datos Grabados correctamente...'); 
      var body = "";
      for (let index = 0; index < data['rows'].length; index++) {
        body += 
          '<tr>'+ 
            '<td>' + data['rows'][index]['fecha'] +'</td>' +
            '<td>' + data['rows'][index]['area'] +'</td>' +
            '<td>' + data['rows'][index]['estado'] +'</td>' +
            '<td>' + data['rows'][index]['motivo'] +'</td>' +
            '<td>' + data['rows'][index]['usuario'] +'</td>' +
          '</tr>'; 
      }

      var myhtml = 
        '<H2>NRO DE SOLICITUD '+ data['rows'][0]['NroSolicitud'] +' </H2>'+
        '<div class="table-responsive table-bordered p-0" style="height:400px; border: 10px solid white; border-radius:30px;">'+
          '<table class="table table-sm table-head-fixed text-nowrap m-0 table-hover table-striped">'+
            '<thead >'+
              '<th style="background-color: #dc3545; color:white;">FECHA</th>'+
              '<th style="background-color: #dc3545; color:white;">AREA</th>'+
              '<th style="background-color: #dc3545; color:white;">ESTADO</th>'+
              '<th style="background-color: #dc3545; color:white;">MOTIVO</th>'+
              '<th style="background-color: #dc3545; color:white;">USUARIO</th>'+
            '</thead>'+
            '<tbody style="font-size:14px;">'+
              body+ 
            '</tbody>'+

          '</table>'+
        '</div>'; 

       swal.fire({
         html: myhtml, 
         width: '100%'
       });

    }) 
    .fail(function(err) { 
      swal.fire('error al grabar detalle.. ' + err , '', 'error' ); 
    });  
  }

  aprobar(area , solicitud , estado , operario , ot ){

    //datos base para la aprobacion... 
    var datos = [], usuario = ""; 
    usuario = localStorage.getItem('user');
    datos.push( 
      {name: 'id', value: solicitud }, 
      {name: 'usuario', value: usuario }, 
      {name: 'area', value: area }, 
      {name: 'estado', value: estado }, 
    );

      //si se modifico el detalle se agrega aqui... 
      var tbl = $("#TD"+ solicitud +" tr").has('td') , celda : any; 
      for (let index = 0; index < tbl.length; index++) {
        //si el valor es diferente a la seleccion del usuario actualiza el detalle ... 
        // el atributo valor es una variable que trae por defecto y podra comparar con innertext del item..
        if($("#D" + solicitud + (index + 1)).text() != $("#D" + solicitud + (index + 1)).attr('valor') ){
          datos.push({name: 'idDet', value: $("#D" + solicitud + (index + 1)).attr('iddet') });
        }
        console.log( 'valor del contenido ',  $("#D" + solicitud + (index + 1)).text() + 'valor defecto ', $("#D" + solicitud + (index + 1)).attr('valor') );
      }

      //si se rechaza tiene otro tratamiento... 
    if(estado == 'RECHAZADO'){
      //tiene que tener marcado algun detalle para el rechazo 
      if($("#TD"+solicitud+" tbody tr:contains(RECHAZADO) td:nth-child(2)[valor!='RECHAZADO']").length == 0 ){ 
        alert('No ha indicado que fila del detalle es rechazado favor haga click sobre el estado !! ') ;
        return ;
      }
      //si es rechazado debe ingresar un motivo por el rechazo
      var motivo = prompt("INGRESE MOTIVO RECHAZO !!!" );
      if(motivo == null ) return ;
      if(motivo.length == 0){
        swal.fire('No ingreso ningun motivo !!!');
        return ;
      }
      datos.push({name: 'motivo' , value: motivo });

    }else if(estado == 'ESPERA'){
      if($("#TD"+solicitud+" tbody tr:contains(ESPERA)").length == 0 ){ 
        alert('No ha indicado que fila del detalle esta en Espera !! ') ;
        return ;
      }
      //si es rechazado debe ingresar un motivo por el rechazo
      var motivo = prompt("INGRESE MOTIVO de ESPERA !!!" );
      if(motivo == null ) return ;
      if(motivo.length == 0){
        swal.fire('No ingreso ningun motivo !!!');
        return ;
      }
      datos.push({name: 'motivo' , value: motivo });
    }else if(estado == 'PENDIENTE'){
      //si es rechazado debe ingresar un motivo por el rechazo
      var motivo = prompt("INGRESE MOTIVO de ESPERA !!!" );
      if(motivo == null ) return ;
      if(motivo.length == 0){
        swal.fire('No ingreso ningun motivo !!!');
        return ;
      }
      datos.push({name: 'motivo' , value: motivo }); 
    }else if(estado == 'ENTREGADO'){ 
      if($("#TD"+solicitud+" tbody tr:contains(ESPERA)").length > 0 ){ 
        alert('Existen item en Espera actualice el estado del item de espera a Aprobado !! '); 
        return; 
      } 
    }else{
      /* CONTROL ANTERIOR LOS ITEN RECHAZADO NO PUEDEN MODIFICARSE MAS... 
      //para aprobar todos los estados tienen que estar nuevo.. 
      if($("#TD"+solicitud+" tbody tr:contains(RECHAZADO)").length > 0 ){ 
        alert('No puede aprobar si un item del detalle esta rechazado !! ') ;
        return ;
      }
      */
      datos.push({name: 'motivo' , value: '' }); 
    }
    console.log(datos);
    var url;
    var servidor = window.location.origin;    
    if (servidor.indexOf('localhost') >0 ){
      url = "http://192.168.10.54:3010/garantia-aprobacion";
    }else{
      url = servidor + "/garantia-aprobacion";
    }
    var promesa = new Promise((resolve , reject )=>{
        
      $.post( url, datos  ) 
      .done(function( data ) { 
        console.log(data); 
        swal.fire('Datos Grabados correctamente...'); 
        //window.location.reload(); 
        resolve(1);
      }) 
      .fail(function(err) { 
        swal.fire('error al grabar detalle.. ' + err , '', 'error' ); 
        reject(0);
        return ;
      }); 
    });
    promesa
    .then((value)=>{
      this.buscar(0);
    })
    .then((value)=>{
      console.log('aprobacion datos... ');
      console.log(area , solicitud , estado );
      if(estado == 'APROBADO'){
        if(area == 'TALLER'){
          area = 'GARANTIA';
        }else if( area == 'GARANTIA'){
          area = 'REPUESTO';
        }
      }
      this.websocket.emit('pendientes', { 
          mensaje: 'El '+ localStorage.getItem('area') +' '+ localStorage.getItem('nombre') +' ha modificado la Solicitud de OT NRO '+ ot +' en estado  '+ estado +' !!! ' , 
          para: operario,
          area: area 
      });

    });

  }

}
