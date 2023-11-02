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

const URL = localStorage.getItem('url');
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

      $.get(URL+ "/garantia-solicitudes?ot=" + ot +"&usuario="+ usuario +"&area="+ area, function(data, status){
        console.log('estado de la consulta ', status );
      })
      .done((rs)=>{ 
        this.spinner(0); 
        //ordernar los resultados... pendiente rechazado y aprobado
        rs['rows'] = rs['rows']
        .map(item =>{ return( {...item, orderEstado:({'PENDIENTE':1 , 'ENTREGADO':2 , 'APROBADO':3, 'CERRADO':4, 'RECHAZADO':5})[item.estado] } )})
        .sort((a,b)=> a.orderEstado - b.orderEstado || a.area.localeCompare(b.area) || b.FSolicitud - a.FSolicitud )
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
                  '<th class="border border-white" style="width:50px;">Cantidad</th>'+ 
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
                  subTable +='<td>'+ (listado[0][index]['cantidad'] ?? '') +'</td>'+
                  '<td>'+ (listado[0][index]['incidente'] ?? '') +'</td>'+
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
                          subTable +='<td>'+ (listado[0][index]['cantidad'] ?? '') +'</td>'+
                          '<td>'+ (listado[0][index]['incidente'] ?? '') +'</td>'+
                          '<td>'+ (listado[0][index]['piezaCausal'] ?? '-') +'</td>'+
                          '<td>'+ listado[0][index]['repuesto'] +'</td>'+
                          '<td>'+ listado[0][index]['motivo'] +'</td>'+
                          '<td>'+ listado[0][index]['reparacion'] +'</td>'+
                          '</td>'+

        
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
            if(listado[0][index]['fila'] == 1 && cab[x] != 'repuesto' && cab[x] != 'motivo' && cab[x] != 'reparacion' && cab[x] != 'fila' && cab[x] != 'fila2' && cab[x] != 'id' && cab[x] != 'estado2' && cab[x] != 'idDet' && cab[x] != 'piezaCausal' && cab[x] != 'incidente'  && cab[x] != 'codigoRep'  && cab[x] != 'nombreRep' && cab[x] != 'codigoRemision' && cab[x] != 'fecha' && cab[x] != 'emisor'){
              if(cab[x] == 'estado'){
                if(listado[0][index][ cab[x] ] == 'APROBADO'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-success w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'RECHAZADO'){
                  body += '<td style="vertical-align:middle"><span class="badge badge-danger w-100">' + listado[0][index][ cab[x] ] + '</span></td>'; 
                }else if(listado[0][index][ cab[x] ] == 'CERRADO'){
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
          if(cab[index] != 'repuesto' && cab[index] != 'motivo' && cab[index] != 'reparacion' && cab[index] != 'fila' && cab[index] != 'fila2' && cab[index] != 'id' && cab[index] != 'estado2' && cab[index] != 'idDet'  && cab[index] != 'piezaCausal' && cab[index] != 'incidente'  && cab[index] != 'codigoRep'  && cab[index] != 'nombreRep'  && cab[index] != 'codigoRemision'  && cab[index] != 'fecha' && cab[index] != 'emisor'){
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

            /* area de volver a la solicitud para consultar o modificar  */
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= ' <i class="fa fa-camera" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-danger btn-sm ml-2'; 
            button.setAttribute('id','BFOTO'+ listado[0][index]['nro']); //asigar id al boton para luego agregar el evento click.. 
            document.getElementById('NRO'+ listado[0][index]['nro'] ).append( button ); //se agrega el boton a la linea... 
            document.getElementById('BFOTO'+ listado[0][index]['nro'] ).addEventListener('click',()=>{ //se agrega el evento ... 
              //alert('foto de la ot nro ' + listado[0][index]['ot'] );
              this.linkCM(listado[0][index]['ot'])
            }); 

            /* area de volver a la solicitud para consultar o modificar  */
            button = document.createElement('button'); //creamos un buton para ver el detalle.. 
            button.innerHTML= ' <i class="fa fa-bookmark" aria-hidden="true"></i>'; //icono.. 
            button.className = 'btn btn-warning btn-sm ml-2'; 
            button.setAttribute('id','BTEXT'+ listado[0][index]['nro']); //asigar id al boton para luego agregar el evento click.. 
            document.getElementById('NRO'+ listado[0][index]['nro'] ).append( button ); //se agrega el boton a la linea... 
            document.getElementById('BTEXT'+ listado[0][index]['nro'] ).addEventListener('click',()=>{ //se agrega el evento ... 
              //alert('detalle de la solicitud ' + listado[0][index]['ot'] );
              this.detalleSolicitud(listado[0][index]['ot'],listado[0][index]['vin'] );
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
              //( listado[0][index]['area'] == 'TALLER'  && ( listado[0][index]['estado'] == 'RECHAZADO' || listado[0][index]['estado'] == 'PENDIENTE'|| listado[0][index]['estado'] == 'MODIFICADO' )) ||
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
              this.aprobar( 'REPUESTO', listado[0][index]['id'] , 'ENTREGADO', listado[0][index]['usuario'], listado[0][index]['ot'] );
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
    
    $.get( URL + "/garantia-log?solicitud=" + solicitud ) 
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

async detalleSolicitud(ot, vin ){

  //recuperamos datos de repuestos entregados 
  let res = await fetch(`${URL}/garantia-repuesto/${ot}`)
  let repuesto = await res.json()
  console.log(repuesto)

  //recuperamos datos de los service
  res = await fetch(`${URL}/garantia-servicios?vin=${vin}`)
  let servicios = await res.json()
  console.log(servicios)
  

  await fetch(`${URL}/garantia-solicitudes?ot=${ot}&usuario=admin&area=ADMINISTRADOR`)
        .then(response => response.json())
        .then(res => {console.log(res)
        
          let plantilla = `
            <style type="text/css">
            *{
                margin:0;
                padding: 0;
            }
  
            .container{
                display: grid;
                grid-template-columns: 1fr;
                /*grid-template-rows: 30px 0px 150px 550px 600px 150px;*/
                grid-template-rows: 30px 0px 150px auto auto  130px;                                
                grid-gap: 5px;
                height: 99%;
                width: 100%;
                border-radius:5px;
                font-size: 12px;
                margin:auto;
            }
  
            .titulo{
                text-align: center; 
                /* border-bottom: 1px solid #8b8b8b; */
            }
  
            .titulo2{
                text-align: center; 
            }
            
            .box1{ 
                display: grid;
                grid-template-columns: 1fr 1fr;
                /* border: 1px solid #8b8b8b; */
            }
            .box1 .b1-col1, 
            .box1 .b1-col2{ 
                display: flex;
                align-items: center;
                justify-content: center;
                border-bottom: 1px solid #8b8b8b;
            } 
  
            .box2{ 
                display: grid;
                grid-template-columns: 1fr;
                border: 1px solid #8b8b8b;
                border-radius: 5px;
            }
  
            .box2 .b2-row1{
                padding-left: 10px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                justify-content: space-around;
            }
  
            .box2 .b2-row2{ 
                display: grid;
                grid-template-columns: 0.3fr 0.5fr 0.3fr 1fr;
                border-bottom: 1px solid #8b8b8b;        
            }
  
            .b2-row2 * {
                display: flex;
                align-items: center;
            }
            
            .b2-row2-col{
                border-right: 1px solid #8b8b8b;
                padding-left: 5px;
            }
            .b2-row2-col:nth-child(odd){
              font-weight:bold;
              background-color:#f4f4f5;
            }
  
            .box3{ 
                display: grid;
                grid-template-columns: 0.5fr 0.3fr 1fr 1fr 1fr;
                border: 1px solid #8b8b8b;
                border-radius: 5px;
            }
  
            .box3 .b3-row1-col1{
                padding-left:5px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                grid-column: span 1;
                background-color:#f4f4f5;
                border-right: 1px solid #8b8b8b;                
                border-left: 1px solid #8b8b8b;                
            }

            .box3 .b3-row1-col2{
                padding-left:5px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                grid-column: span 4;
                border-right: 1px solid #8b8b8b;                
            }

            .box3 .b3-row1-t{
                padding-left: 5px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                justify-content: center;
                grid-column: span 5;
                font-weight:bold;
            }
  
            .box3 .b3-row2{ 
                display: flex;
                align-items: center;
                justify-content: left;
                border-bottom: 1px solid #8b8b8b; 
                border-left: 1px solid #8b8b8b; 
                padding-left:5px;
            }
            .title-detail{
              background-color:#f4f4f5;
              font-weight:bold;
            }
  
  
            .box4{ 
                display: grid;
                /*grid-template-columns: 0.2fr 0.4fr 1.5fr 0.1fr 0.2fr 0.7fr;*/
                grid-template-columns: 0.2fr auto auto 0.1fr 0.2fr auto;
                /* border-bottom: 1px solid #8b8b8b; */
                border: 1px solid #8b8b8b;
                border-radius: 5px;
            }
  
            .box4 .b4-row1{
                padding-left: 10px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                grid-column: span 6;
            }
            .box4 .b4-row1-t{
                padding-left: 10px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                justify-content: center;
                grid-column: span 6;
                font-weight:bold;
            }
  
            .box4 .b4-row2{ 
                padding-left: 5px;
                display: flex;
                align-items: center;
                justify-content: left;
                border-bottom: 1px solid #8b8b8b; 
                border-left: 1px solid #8b8b8b; 
            }
  
            .box5{ 
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                border: 1px solid #8b8b8b;
                border-radius: 5px;
            }
  
            .box5 .b5-row1{
                padding-left: 10px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                grid-column: span 4;
            }
            .box5 .b5-row1-t{
                padding-left: 10px;
                border-bottom: 1px solid #8b8b8b;
                display: flex;
                align-items: center;
                justify-content: center;
                grid-column: span 4;
                font-weight:bold;
            }
  
            .box5 .b5-row2{ 
                padding-left: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-bottom: 1px solid #8b8b8b; 
                border-left: 1px solid #8b8b8b; 
            }

            @media print {
              *:not(h2):not(#ot2) {font-size:10px;} 
            }            

          </style>
  
          <div class="container">
          <!-- titulo --> 
          <div class="titulo">
              <h2 class="title">SOLICITUD GARANTIA OT #</h2>
          </div>
          
          <!-- cabecera 1 --> 
          <div class="box1">
          </div>
  
          <!-- cabecera 2 --> 
          <div class="box2">

              <div class="b2-row2">
                  <div class="b2-row2-col">FECHA RECEPCION: </div><div class="b2-row2-col" id="so-FOt"> </div> 
                  <div class="b2-row2-col">AREA: </div><div class="b2-row2-col" id="so-area"> </div> 

              </div>
              
              <div class="b2-row2">
                <div class="b2-row2-col">FECHA SOLICITUD: </div><div class="b2-row2-col" id="so-FSolicitud"> </div> 
                <div class="b2-row2-col">ESTADO: </div><div class="b2-row2-col" id="so-estado"> </div>
              </div>
  
              <div class="b2-row2">
                <div class="b2-row2-col">FECHA VENTA: </div><div class="b2-row2-col" id="so-FVenta"> </div>
                <div class="b2-row2-col">CLIENTE: </div><div class="b2-row2-col" id="so-cliente"> </div>
              </div>
  
              <div class="b2-row2">
                  <div class="b2-row2-col">VIN: </div><div class="b2-row2-col" id="so-vin"> </div> 
                  <div class="b2-row2-col">MODELO: </div><div class="b2-row2-col" id="so-modelo"> </div>
              </div>
  
              <div class="b2-row2">
                  <div class="b2-row2-col">KM. ENTRADA: </div><div class="b2-row2-col" id="so-u_kmentrada"> </div> 
                  <div class="b2-row2-col">KM. SALIDA: </div><div class="b2-row2-col" id="so-u_kmsalida"> </div>
              </div>
  
              <div class="b2-row2">
                  <div class="b2-row2-col">VDN: </div><div class="b2-row2-col" id="so-vdn"> </div> 
                  <div class="b2-row2-col">TIPO GARANTIA: </div><div class="b2-row2-col" id="so-tipoGarantia"> </div>
              </div>
  
              <div class="b2-row2">
                  <div class="b2-row2-col">JEFE GRUPO: </div><div class="b2-row2-col" id="so-nombreJefeGrupo"> </div> 
                  <div class="b2-row2-col">MECANICO: </div><div class="b2-row2-col" id="so-mecanico"> </div>
              </div>
  
  
          </div>
  
  
          <!-- detalle 1 -->
          <div class="box3">
              <div class="b3-row1-t title-detail">DETALLE SOLICITUD</div>
              <div class="b3-row1-col1"><strong>SINTOMA CLIENTE:</strong></div> <div class="b3-row1-col2" id="so-pedido"></div>
              <div class="b3-row1-col1"><strong>SINTOMA TECNICO:</strong></div> <div class="b3-row1-col2" id="so-sintoma"></div>

              <!--cabecera detalle-->
              <div class="b3-row2 title-detail">INCIDENTE</div>
              <div class="b3-row2 title-detail">PIEZA CAUSAL</div>
              <div class="b3-row2 title-detail">PIEZAS SOLICITADAS</div>
              <div class="b3-row2 title-detail">DIAGNOSTICO TECNICO</div>
              <div class="b3-row2 title-detail">REPARACION</div>
  
              <!--datos  col1 / col2  aqui va los detalles -->


          </div>
          <!-- detalle 2 -->
          <div class="box4">
              <div class="b4-row1-t title-detail">DETALLE REPUESTOS</div>
  
              <!--cabecera detalle-->
              <div class="b4-row2 title-detail">REMISION</div>
              <div class="b4-row2 title-detail">CODIGO</div>
              <div class="b4-row2 title-detail">ARTICULO</div>
              <div class="b4-row2 title-detail">CANT.</div>
              <div class="b4-row2 title-detail">FECHA</div>
              <div class="b4-row2 title-detail">MECANICO</div>
  
              <!--datos  6 COL fila 1 -->
              <!-- 
              <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div>
              <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div>
              -->
              
          </div>
  
          <!-- detalle 2 -->
          <div class="box5">
              <div class="b5-row1-t title-detail">DETALLE MANTENIMIENTOS</div>
  
              <!--cabecera detalle-->
              <div class="b5-row2 title-detail">ITEM</div>
              <div class="b5-row2 title-detail">FECHA</div>
              <div class="b5-row2 title-detail">SERVICE</div>
              <div class="b5-row2 title-detail">KM</div>
              
              <!--datos  4 COL fila 1 -->
              <!-- <div class="b5-row2"></div><div class="b5-row2"></div><div class="b5-row2"></div><div class="b5-row2"></div>
              <div class="b5-row2"></div><div class="b5-row2"></div><div class="b5-row2"></div><div class="b5-row2"></div> -->

          </div>
        </div>
        <div class="boxButtons">
          <button type="button" id="printSolicitud" onclick="imprimir()" class="btn btn-primary mt-3">Imprimir</button>
          <button type="button" id="closePreview"class="btn btn-warning mt-3 text-center">Salir&nbsp;&nbsp;&nbsp;</button>
        </div>
          `      

            swal.fire({
              html: plantilla, 
              width: '100%',
              showCloseButton: true,
              showConfirmButton: false,
              //run after show popup 
              didOpen:()=>{
                //recorremos la fila 
                res.rows.forEach(item=> {
                  Object.entries(item).map(item=> {
                    //insertamos datos en la cabecera box2
                    if(item[0] === 'ot'){
                      $(`.title`).text( 'SOLICITUD GARANTIA OT #' + String(item[1]).toUpperCase() )  

                    }else{
                      $(` #so-${item[0]}`).text( String(item[1]).toUpperCase() )  
                    }
                  })

                  //insertamos datos en el detalle solicitud box3 
                  $(`.box3`).append(`<div class="b3-row2">${item.incidente}</div> <div class="b3-row2">${item.piezaCausal}</div> <div class="b3-row2">${item.repuesto}</div> <div class="b3-row2">${item.motivo}</div> <div class="b3-row2">${item.reparacion}</div>`)  
                  //$(` #ot2`).text( "#"+ $("#so-ot").text() )
                })
                //agregamos los detalles faltantes 
                if(res.rows.length < 20){
                  let detalle1 = new Array(20 - res.rows.length).fill('<div class="b3-row2">&nbsp;</div> <div class="b3-row2">&nbsp;</div> <div class="b3-row2">&nbsp;</div> <div class="b3-row2">&nbsp;</div> <div class="b3-row2">&nbsp;</div>\n',0)
                  detalle1.map(item=> $(`.box3`).append(item))
                }

                //detalle repuesto... 
                repuesto.remision.map(item=>{
                  $(`.box4`).append(`<div class="b4-row2">${item.REMISION}</div> <div class="b4-row2">${item.CODIGO}</div> <div class="b4-row2">${item.ARTICULO}</div>
                  <div class="b4-row2">${item.CANTIDAD}</div> <div class="b4-row2">${item.fecha}</div> <div class="b4-row2">${item.firmado}</div>\n `)  
                })

                if(repuesto.remision.length < 20){
                  let detalle2 = new Array(20 - repuesto.remision.length).fill( `
                  <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div>
                  <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div> <div class="b4-row2">&nbsp;</div>\n `)
                  detalle2.map(item=> $(`.box4`).append(item))
                }

                //detalle de mantenimiento... 
                servicios.rows.map(item=>{
                  $(`.box5`).append( `<div class="b5-row2">${item.fila}</div><div class="b5-row2">${item.fecha}</div><div class="b5-row2">${item.servicio}</div><div class="b5-row2">${item.km}</div>`)
                })
                
                let detalle3 = new Array(5 - servicios.rows.length).fill( `<div class="b5-row2">&nbsp;</div><div class="b5-row2">&nbsp;</div><div class="b5-row2">&nbsp;</div><div class="b5-row2">&nbsp;</div>\n `)
                detalle3.map(item=> $(`.box5`).append(item))
                //agregamos el evento imprimir al boton 
                document.getElementById('printSolicitud').addEventListener('click', () => { this.imprimir() });
                document.getElementById('closePreview').addEventListener('click', () => { swal.close() });
              }
            })
        })
}

imprimir(){
  alert('imprimir..')
  $(".boxButtons").css('display', 'none') 
  let html="<html>";
  html+= document.getElementById("swal2-content").innerHTML;
  console.log(html)
  html+="</html>";
  let printWin = window.open('','','left=0,top=0,width=auto,height=auto,toolbar=0,scrollbars=0,status  =0');
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  printWin.print();
  //printWin.close();  
  $(".boxButtons").css('display', 'block') 

}


async linkCM(ot){
  // Solicitud GET (Request).
  await fetch(URL +`/garantia-fotos/${ot}` )
  // Exito
  .then(response => response.json())  // convertir a json
  .then(json =>{
    console.log(json)
    if(json.length > 0){
        let imagenes = '' ,indicador=''
        json.forEach((item, x)=>{
          //imagenes += ` <a class="" href="${item}" download="${$("#ot").val()+'_'+x}.jpg" ><img class="img-fluid rounded" id="foto-${x}" src="${item}" alt="" width="70" height="70" data-toggle="tooltip" data-placement="top" title="click descarga individual"></a> \n`
          if(item.includes('videos')){
            imagenes += `<video width="320" height="240" id="foto-${x}" controls> <source src="${item }" type="video/mp4"> </video> \n`

          }else{
            imagenes += ` <img class="img-fluid rounded" id="foto-${x}" src="${item}" alt="" width="200" height="200" data-toggle="tooltip" data-placement="top" title=""> \n`
          }

        })
        console.log(imagenes)
        console.log(indicador)
        let pantalla = `
        <div class="flex justify-content-start" id="myfotos">
          ${imagenes}
        </div>
        <div class="container-fluid" id="fotoGrande">
        
        </div>
        <div class="flex justify-content-end">
          <button type="button" id="bDescargar" class="btn btn-sm btn-info mt-4">Descargar todo</button>
        </div>
        `
      swal.fire({
        title: `<strong><u>Fotos (${json.length })</u></strong>`,
        showCloseButton: true,
        showConfirmButton: false,
        html: pantalla,
        width: '100%',
      })
      .then(e =>{
  
      });

        document.getElementById("bDescargar").addEventListener("click", async ()=>{

          $( "#bDescargar" ).addClass( "progress-bar progress-bar-striped progress-bar-animated mx-auto" )
          $( "#bDescargar" ).html( "<b>Descargando...</b>" )
          await fetch(URL + `/garantia-descargar-fotos/${ot}`)
          .then(response => response.blob())
          .then(blob => {
              var url = window.URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url;
              a.download = `${ot}.zip`;
              document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
              a.click();
              a.remove();  //afterwards we remove the element again
              $( "#bDescargar" ).removeClass( "progress-bar progress-bar-striped progress-bar-animated mx-auto" )
              $( "#bDescargar" ).html( "Descargar todo" )                

          });

       }); 
    }else{
      swal.fire('No tiene fotos asignados!')
    }

  })    //imprimir los datos en la consola
  .catch(err => console.log('Solicitud fallida', err)); // Capturar errores    

}


async  subAprobar(area, solicitud, estado, operario, ot ){
    //datos base para la aprobacion... 
    var datos = [], usuario = ""; 
    usuario = localStorage.getItem('user');

    if(area === 'GARANTIA' && estado === 'PENDIENTE'){
      area = 'TALLER'
    }

    datos.push( 
      {name: 'id', value: solicitud }, 
      {name: 'usuario', value: usuario }, 
      {name: 'area', value: (area === 'TALLER' && estado === 'MODIFICADO'? 'GARANTIA' : area ) }, 
      {name: 'estado', value: (area === 'TALLER' && estado === 'MODIFICADO'? 'PENDIENTE' : estado ) }, 
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
      /*
      //tiene que tener marcado algun detalle para el rechazo 
      if($("#TD"+solicitud+" tbody tr:contains(RECHAZADO) td:nth-child(2)[valor!='RECHAZADO']").length == 0 ){ 
        alert('No ha indicado que fila del detalle es rechazado favor haga click sobre el estado !! ') ;
        return ;
      }
      */
      //si es rechazado debe ingresar un motivo por el rechazo
      var motivo = prompt("INGRESE MOTIVO RECHAZO !!!" );
      if(motivo == null ) return ;
      if(motivo.length == 0){
        swal.fire('No ingreso ningun motivo !!!');
        return ;
      }
      datos.push({name: 'motivo' , value: motivo });

    }else if(estado == 'ESPERA'){
      /*
      if($("#TD"+solicitud+" tbody tr:contains(ESPERA)").length == 0 ){ 
        alert('No ha indicado que fila del detalle esta en Espera !! ') ;
        return ;
      }*/
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
    var promesa = new Promise((resolve , reject )=>{
        
      $.post(URL + `/garantia-aprobacion`, datos  ) 
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
    .then(async(value)=>{
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
      if(area === 'REPUESTO' || area === 'GARANTIA'){
        await fetch(URL+"/garantia-chatId/" + operario )
        .then(response => response.json())  // convertir a json
        .then(async(json) => {
          const chatId = json[0].chat_id;
          await fetch(URL +`/telegram-send?chat_id=${chatId}&mensaje=${localStorage.getItem('area')} ${localStorage.getItem('nombre')} ha ${(estado=== 'PENDIENTE'? 'puesto en ESPERA' : estado)} la solicitud nro OT ${ot} motivo ${motivo}` )
            .then(response => response.json())  // convertir a json
            .then(json => console.log('se envio telegram....'))
            .catch(err => console.log('Solicitud fallida', err)); // Capturar errores 
        })
        .catch(err => console.log('Solicitud fallida', err)); // Capturar errores 
      }
     

    });    
  }

  async aprobar(area , solicitud , estado , operario , ot ){

    localStorage.setItem('repuestoOK','0')
    localStorage.setItem('ot', ot)
    if(area == 'REPUESTO' && estado == 'ENTREGADO'){
      //controlamos si existen remision para repuesto 
      // Solicitud GET (Request).
      var control=0;
      let remision = '' , detalle = '' , mecanicos=''       
      await fetch(URL + '/garantia-repuesto/' + ot)
        // Exito
        .then(response => response.json())  // convertir a json
        .then(json => {
          console.log('datos de la remision .... ',json)
          if( json.remision.length == 0 ){
            swal.fire('No tiene Remision la orden, favor primero haga la remision para aprobar la solicitud !!!')
            control = 1 
          }else{
            localStorage.setItem('lista-remision', JSON.stringify(json.remision))
            localStorage.setItem('lista-detalle', JSON.stringify(json.detalle))
            localStorage.setItem('lista-mecanicos', JSON.stringify(json.mecanicos))

            json.remision.forEach((item,x)=>{
              if(item.firmado.length > 0 ){
                remision+= `<tr style="background:#B6D7A8">
                              <td id="remision-${x}" data-name="${item.ARTICULO}"> ${item.REMISION}</td>`
              }else{
                remision+= `<tr>
                              <td draggable="true" id="remision-${x}" style="cursor: pointer" 
                                data-codigo="${item.CODIGO}" 
                                data-name="${item.ARTICULO}" 
                                data-remision="${item.REMISION}" 
                                data-emisor="${item.userCreate}" 
                                data-fecha="${item.fecha +' '+ item.hora}"> 
                                <i class="fa fa-chevron-circle-left" aria-hidden="true"></i> ${item.REMISION}</td>`

              }
                remision+= `<td>${item.CODIGO}</td>
                            <td>${item.ARTICULO}</td>
                            <td>${item.CANTIDAD}</td>
                            <td>${item.fecha +' '+ item.hora}</td>
                            <td>${item.userCreate}</td>
                            <td>${item.firmado ?? ''}</td>
                          </tr>`
            })
          
            json.detalle.forEach(item=>{
              detalle+= `<tr id="det-${item.id}">
                            <td>${item.id}</td>
                            <td>${item.incidente}</td>
                            <td>${item.repuesto}</td>
                            <td><input type="text" id="detalle-${item.id}" data-codigo="" data-name="" data-remision="" data-emisor="" data-fecha="" readonly/></td>
                          </tr>`
            })

            let listaSort= json.mecanicos.sort((a,b)=> a.nombre.localeCompare(b.nombre) )
            listaSort.forEach(item=>{
              mecanicos+= `<tr>
              <td style="text-align:left;" class="fila-${item.chatid}">${item.nombre}</td>
              <td class="fila-${item.chatid}">
                <button type="button" id="reset-${item.chatid}" class="btn btn-danger btn-sm mr-2" style="visibility:hidden;"> <i class="fa fa-trash-alt" aria-hidden="true"></i></button>
                <button type="button" id="firma-${item.chatid}" class="btn btn-success btn-sm" style="visibility:hidden;"> <i class="fa fa-paper-plane" aria-hidden="true"></i></button>
              </td>
              <td id="mecanico-${item.chatid}" style="max-width:120px; font-weight:bold;" class="fila-${item.chatid}"></td>
              `
            })

          }
          console.log(json)             
        })    //imprimir los datos en la consola
        .catch(err => console.log('Solicitud fallida', err)); // Capturar errores   
        
        if(control === 1){
          return;
        }else{
          localStorage.removeItem('mecanico-chatId')
          var myhtml = 
          `
          <H2>NRO DE OT ${ot} </H2>
          <div class="d-flex justify-content-center">
            <div class="table-responsive table-bordered p-0" style="height:400px; border: 10px solid white; border-radius:30px;">

              <h4>Lista Mecanicos</h4>
              <table class="table table-sm table-head-fixed text-nowrap m-0 table-hover table-striped" id="table-mecanico">
                <thead >
                  <th style="background-color: #dc3545; color:white;">MECANICO</th>
                  <th style="background-color: #dc3545; color:white;">#</th>
                  <th style="background-color: #dc3545; color:white;">REMISION</th>
                </thead>
                <tbody style="font-size:14px;" id="detalleRemision">
                  ${mecanicos} 
                </tbody>
    
              </table>
            </div>'             

            <div class="table-responsive table-bordered p-0" style="height:400px; border: 10px solid white; border-radius:30px;">
              <h4>Remision de la OT Garantia</h4>
              <table class="table table-sm table-head-fixed text-nowrap m-0 table-hover table-striped" id="table-remision">
                <thead >
                  <th style="background-color: #dc3545; color:white;">REMISION</th>
                  <th style="background-color: #dc3545; color:white;">CODIGO</th>
                  <th style="background-color: #dc3545; color:white;">ARTICULO</th>
                  <th style="background-color: #dc3545; color:white;">CANTIDAD</th>
                  <th style="background-color: #dc3545; color:white;">FECHA</th>
                  <th style="background-color: #dc3545; color:white;">EMISOR</th>
                  <th style="background-color: #dc3545; color:white;">FIRMADO POR</th>
                </thead>
                <tbody style="font-size:14px;">
                  ${remision}
                </tbody >
    
              </table>
            </div>'             
          </div>
          <div class="flex justify-content-end">
            <button type="button" id="bVerificarFirma" class="btn btn-sm btn-warning mt-4" style="visibility:hidden;">Verificar Firma</button>
            <button type="button" id="bActualizarRemision" class="btn btn-sm btn-info mt-4" style="visibility:hidden">Entregar</button>
          </div>
      `
          
         swal.fire({
            showCloseButton: true,
            showConfirmButton: false,
            html: myhtml, 
            width: '100%'
          }).then(x=>{

            if(localStorage.getItem('repuestoOK') === '1'){
              this.subAprobar(area, solicitud, estado, operario, ot ) 
            }

          }) 


          //para copiar los datos de la remision a la lista facilmente 
          const remisionList = JSON.parse(localStorage.getItem('lista-remision'))
          const detalleList = JSON.parse(localStorage.getItem('lista-detalle'))
          const mecanicosList = JSON.parse(localStorage.getItem('lista-mecanicos'))

          //habilitar el boton cuando este todo firmado...
          if(remisionList.findIndex(item=> item.firmado.length === 0) >= 0){
            //
          }else{
            $("#bActualizarRemision").css('visibility', 'visible')
          }

          let dragged = null
          remisionList.forEach((item,x)=>{
            $("#remision-" + x).on("dragstart", (event) => {
              dragged = event.target;
            })
          })

          detalleList.forEach((item,x)=>{
            $("#detalle-" + item.id).on("dragover", (event) => { event.preventDefault() })
            $("#detalle-" + item.id).on("drop", (event) => {
              event.target.value = dragged.dataset.codigo
              event.target.dataset.codigo = dragged.dataset.codigo
              event.target.dataset.name = dragged.dataset.name
              event.target.dataset.remision = dragged.dataset.remision
              event.target.dataset.emisor = dragged.dataset.emisor
              event.target.dataset.fecha = dragged.dataset.fecha
            })
          })

          mecanicosList.forEach((item,x)=>{
            //agregamos css a la fila de la tabla de mecanicos que estamos haciendo hover con drag
            $("#mecanico-" + item.chatid).on("dragenter", (event) => { 
              if ($("#mecanico-" + item.chatid).css('background') == 'none') {
                $("#table-mecanico td").css('background','none')
                $(".fila-" + item.chatid).css('background', '#B6D7A8')
              } 
            })

            //prevenimos que se ejecute varias veces el evento
            $("#mecanico-" + item.chatid).on("dragover", (event) => { event.preventDefault() })
            //con esto recibimos los datos de la otra fuente
            $("#mecanico-" + item.chatid).on("drop", (event) => {

              if(localStorage.getItem('mecanico-chatId') === null ){
                localStorage.setItem('mecanico-chatId',item.chatid)
              }else if(localStorage.getItem('mecanico-chatId') !== item.chatid){
                alert('No puede asignar a varios mecanicos...')
                return 
              }
              let lista = event.target.innerText.split(',')
              lista = lista.map(item=> item.replace('\n', '')).filter(item=> item.length > 0) // limpiamos la lista de remisiones
              if(lista.findIndex(item=> item == dragged.dataset.remision)>=0 ){
                alert('ya existe el item')
              }else{
                event.target.style.backgroundColor = '#B6D7A8'
                event.target.innerHTML += dragged.dataset.remision +',<br>' 
                //let id = event.target.id.match(/\d/g).join('')
                $(`#firma-${item.chatid}`).css('visibility', 'visible')
                $(`#reset-${item.chatid}`).css('visibility', 'visible')
                console.log(event.target.innerText)
              }
            })

            //reseteamos toda la fila 
            $("#reset-" + item.chatid).on("click", (event) => {
              $(`#firma-${item.chatid}`).css('visibility', 'hidden')
              $(`#reset-${item.chatid}`).css('visibility', 'hidden')
              $("#mecanico-" + item.chatid).html('')           
              $("#table-mecanico td").css('background','none')
              localStorage.removeItem('mecanico-chatId')
            })

            //para enviar la firma a telegram
            $("#firma-" + item.chatid).on("click", async(event) => {
              let lista = $(`#mecanico-${item.chatid}`).text().split(',')
              lista = lista.map(item=> item.replace('\n', '')).filter(item=> item.length > 0)
              let remisiones =[]
              // filtramos solo las remisiones que fueron asignadas
              remisiones = remisionList.filter(item=> lista.includes(String(item.REMISION)) )
              let mensaje = {
                title:'*Repuesto te ha asignado estas remisiones:*',
                ot: remisionList.at(0).CallID,
                remisiones: lista,
                detalles: remisiones
              }
              console.log(lista)
              console.log(remisionList)
              console.log(mensaje)
              await fetch(URL + `/telegram-send-firma/${item.chatid}`,{
                method: "POST",
                body: JSON.stringify(mensaje),
                headers: {"Content-type": "application/json; charset=UTF-8"}
              } )
              .then(response => response.json())  // convertir a json
              .then(json =>{
                alert('Mensaje de Firma Enviado')
                $("#bVerificarFirma").css('visibility', 'visible')
                console.log(json)
              })    //imprimir los datos en la consola
              .catch(err => console.log('Solicitud fallida', err)); // Capturar errores        
                    
            })
            /*

select * from sys.tables where name like '%solicitudgar%'
select * from solicitudAcceso
select * from solicitudGar_fotos where mediaGroupId = 13480861239748609	--messageId = 2706            
            */

          })

          $( "#bVerificarFirma" ).on( "click", function() {
            $("#BREN" + localStorage.getItem('ot')).click()
          })


          $( "#bActualizarRemision" ).on( "click", async function() {

            
            var valor = {id: solicitud, estado: 'ENTREGADO', area: 'REPUESTO'} 
            await fetch(URL + `/garantia-upd-cab`, {
              method: "POST",
              body: JSON.stringify(valor),
              headers: {"Content-type": "application/json; charset=UTF-8"}
            })
            .then(response => response.json())  // convertir a json
            .then(json =>{
              alert('Datos grabados correctamente !!')
              window.location.reload()

            })            
            .catch(err => console.log(err)) 
            

          });

          
        }

      return

    }

    this.subAprobar(area, solicitud, estado, operario, ot )

  }


}
