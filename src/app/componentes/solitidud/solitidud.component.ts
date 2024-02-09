import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import * as $ from '../../../../node_modules/jquery';
import * as moment from 'moment'; // add this 1 of 4
import * as io from 'socket.io-client';
import swal from 'sweetalert2';
import * as Push from 'push.js';
import { ToastrService } from 'ngx-toastr';
import { MessagingService } from '../../servicios/messaging.service';
import { WebsocketService } from 'src/app/servicios/websocket.service';
import { info } from 'console';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

const URL = localStorage.getItem('url');
let G_listMob = []
let botonAceptar = false;
@Component({
  selector: 'app-solitidud',
  templateUrl: './solitidud.component.html',
  styleUrls: ['./solitidud.component.css']
})
export class SolitidudComponent implements OnInit, OnDestroy {
  suscription : Subscription;
  suscription2 : Subscription;

  message;
  constructor(private route: ActivatedRoute, private notificacion: MessagingService, private websocket: WebsocketService,private toastr: ToastrService, private router: Router  ) {
   }
ngOnDestroy(){
  //if($("#id").val().length == 0 ){
    this.websocket.emit('cancelar-solicitud', { usuario: localStorage.getItem('nombre') ,user: localStorage.getItem('user') , orden : $("#ot").val() });
  //}

  this.suscription.unsubscribe();
  this.suscription2.unsubscribe();

}

  ngOnInit() {
   
     this.suscription = this.websocket.listen('refrescar-solicitud').subscribe((data: any) => {
     console.log('entro en el socket !!!!')
        this.recuperarSolicitud()
    })

    this.suscription2 = this.websocket.listen('solicitando2').subscribe((data: any) => {
      if(data[0].user == localStorage.getItem('user')){
        return
      }
      console.log(data)
      swal.fire('Atencion','La orden Nro <span class="badge badge-dark" style="font-size:16px;">'+ data[0].orden +'</span> ya esta siendo creada por otro usuario <span class="badge badge-dark" style="font-size:16px;">' + data[0].usuario + '</span> !!!','warning')
      .then(value =>{
        //this.router.navigate(['garantia']) 
      })
    })
   
    $('#vdn').keyup(function () {
      this.value = this.value.toLocaleUpperCase();
    });
    this.recuperarSolicitud();
  }

  recuperarSolicitud(){
    let ot = this.route.snapshot.paramMap.get('id');
    if (Number(ot) != 0) {
      
      if(localStorage.getItem('area') !== 'GARANTIA' && localStorage.getItem('area') !== 'ADMINISTRADOR' ){
        $(".cierre-garantia").attr("disabled", 'disabled');
      } 

      $("#bSolicitar").text("Actualizar")
      //this.notificacion.getToken();// trae el token que genero el usuario... 
      //this.notificacion.sendPush('Garantia', 'Nueva Solicitud de ' + String(ot) );
      //las notificaciones se van a enviar desde el servidor 

      //recupera datos de la ot y datos del vehiculo... 
      $.get(URL +"/garantia-solicitud?ot=" + ot, function (data, status) {
        console.log('estado de la consulta ', status);
      })
        .done(async(rs) => {
          //console.log(rs['rows'].length); 
          //console.log(rs['rows'][0]); 
          var rs2 = rs['rows'][0];
          if (rs['rows'].length == 0) {
            swal.fire('No existen registros !!', '', 'warning');
            return;
          } else {
            Object.keys(rs2).forEach(function (key) {
              var campo = "#" + key;
              //console.log('campos.. ', campo);
              //console.log(rs2[key]);
              console.log(campo, rs2[key])
              $(campo).val(rs2[key]);
            });

            $.get(URL + "/garantia-servicios?vin=" + rs2['vin'], function (data, status) {
              console.log('estado de la consulta ', status);
              console.log(data['rows'].length);
              var datos = data['rows'];
              var body = "";
              if (datos.length > 0) {
                $('#det > *').remove(); //fco vacia el body de la tabla 
                for (let index = 0; index < datos.length; index++) {
                  body += '<tr>';
                  Object.keys(datos[index]).forEach(function (key) {
                    //console.log(datos[index][key]);
                    body += '<td>' + datos[index][key] + '</td>';
                  });
                  body += '</tr>';
                }

              } else {
                body = '<tr> <td class"p-1" colspan="4" style="text-align:center; font-size:24px; padding:1px;" >  <span class="badge badge-secondary w-100"> No Registra servicios !!! </span></td> </tr>';
              }
              document.querySelector('#detServicio').innerHTML = body;
            });
          }

          this.recuperarServiciosTerceros()
          this.recuperarMob()
          this.campanha()
          this.clienteMora()
          this.ultimasGarantias()

          //si tiene remision traer los datos... 
          await fetch(URL+`/garantia-repuesto/${ot}`)
          .then(response => response.json())  // convertir a json
          .then(json =>{
            console.log('lista de remision ', json)
            let body = ''
            if(json.remision.length > 0){
              json.remision.forEach(item=>{
                body += `
                        <tr>
                          <td>${item.REMISION}</td> 
                          <td>${item.CODIGO}</td> 
                          <td>${item.ARTICULO}</td> 
                          <td>${item.CANTIDAD}</td> 
                          <td>${item.fecha +' '+ item.hora}</td> 
                          <td>${item.userCreate}</td> 
                          <td>${item.firmado}</td> 
                        </tr>
                        `
              })
              let cabRemision = `
              <th>REMISION</th>
              <th>CODIGO</th>
              <th>ARTICULO</th>
              <th>CANTIDAD</th>
              <th>FECHA</th>
              <th>EMISOR</th>
              <th>FIRMADO POR</th>              
              `
              $("#cabRemision").html(cabRemision)
              $("#detalleRemision").html(body )
            }

          })    //imprimir los datos en la consola
          .catch(err => console.log('Solicitud fallida', err)); // Capturar errores

          //ver si ya tiene activo traer los datos como estan... 
          var usuario = localStorage.getItem('user');
          var area = localStorage.getItem('area');
          console.log('direccion ', URL + "/garantia-solicitudes?ot=" + ot +"&usuario="+ usuario +"&area="+ area)
          $.get(URL + "/garantia-solicitudes?ot=" + ot +"&usuario="+ usuario +"&area="+ area, async function (data, status) {
            //si ya existe la solicitud recuperar los datos.. 
            if (data['rows'].length > 0) {
              var datos = data['rows'];
              console.log('datos de solicitudes ', datos)
              var body = "";
              localStorage.setItem("detalle-solicitud", JSON.stringify(datos))
              
              for (let index = 0; index < datos.length; index++) {
                body += '<tr nuevo="no" id="det-'+datos[index]['idDet']+'">';
                body += '<td>' + datos[index]['fila'] + (datos[index]['estado'] === 'PENDIENTE' && datos[index]['area'] === 'TALLER' ? '<button type="button" class="btn btn-success btn-sm mb-0 mt-0 ml-1" id="bMotivo-'+ datos[index]['fila'] +'"> <i class="fa fa-edit" aria-hidden="true"></i> </button>' : ''  ) + '</td>' +
                '<td>' + datos[index]['cantidad'] + '</td>' +
                '<td>' + datos[index]['incidente'] + '</td>' +
                '<td>' + datos[index]['repuesto'] + '</td>' +
                  '<td>' + datos[index]['motivo']   + '</td>' +
                  '<td>' + datos[index]['reparacion'] + '</td>'+
                  '<td>' + (datos[index]['piezaCausal'] ?? '') + '</td>';
                if (datos[index]['estado2'] == 'APROBADO' || datos[index]['estado2'] == 'ENTREGADO') {
                  body += '<td><span class="badge badge-success">' + datos[index]['estado2'] + '</span></td>'
                } else if (datos[index]['estado2'] == 'ESPERA' || datos[index]['estado2'] == 'MODIFICADO' ) { //ESTADO DEL DETALLE
                  body += '<td><span class="badge badge-warning">' + datos[index]['estado2'] + '</span></td>'
                } else if (datos[index]['estado2'] == 'RECHAZADO') {
                  body += '<td><span class="badge badge-danger">' + datos[index]['estado2'] + '</span></td>'
                } else {// cuando es nuevo 
                  body += '<td><span class="badge badge-info">' + datos[index]['estado2'] + '</span></td>'
                }

                //body += '<td>' + datos[index]['codigoRep'] ?? ''
                //body += '</td>' + '<td>' + datos[index]['nombreRep'] ?? '' + '</td>' 
                body += '</td>' + '<td>' + datos[index]['codigoRemision'] ?? '' + '</td>' 


                //'<td><span class="badge badge-info">'+ datos[index]['estado']   +'</span></td>'+
                body += '<td></td>'; //columna de los botones... 
                body += '</tr>';

              }
              $("#fecha").val(datos[0]['FSolicitud']);//se recupera de la primera fila .. 
              $("#vdn").val(datos[0]['vdn']);//se recupera de la primera fila .. 
              $("#tipoGarantia").val(datos[0]['tipoGarantia']);//se recupera de la primera fila .. 
              $("#area").val(datos[0]['area']);//se recupera de la primera fila .
              $("#estado").val(datos[0]['estado']);//se recupera de la primera fila .
              $("#id").val(datos[0]['id']);//se recupera de la primera fila .
              $("#mecanico").val(datos[0]['mecanico']);//se recupera de la primera fila .
              $("#jefeGrupo").val(datos[0]['nombreJefeGrupo']);//se recupera de la primera fila .
              $("#sintoma").val(datos[0]['sintoma']);//se recupera de la primera fila .
              $("#fechaCierre").val(String( datos[0]['fechaCierre']|| '').slice(0,10));//se recupera de la primera fila .
              $("#kmCierre").val(datos[0]['kmCierre']);//se recupera de la primera fila .
              $("#comentario").val(datos[0]['comentario']);//se recupera de la primera fila .
              //$("#jefeGrupo").val(datos[0]['jefeGrupo']);//se recupera de la primera fila .
              $("#vdn").attr('readonly', true);
              $("#tipoGarantia").attr("disabled", true); 
              $("#mecanico").attr("disabled", true); 
              $("#sintoma").attr("disabled", true); 
              ($("#kmCierre").val().trim().length > 0 )? $("#kmCierre").attr("disabled", true): ''; 
              ($("#fechaCierre").val().trim().length > 0 )? $("#fechaCierre").attr("disabled", true): '';
              console.log('detalle de la pieza solicitada', body)
              document.querySelector('#piezasSolicitadas').innerHTML = body;

              if( ($("#area").val() == 'GARANTIA' && $("#estado").val() == 'APROBADO') || $("#area").val() == 'REPUESTO' ){
                $("#bReapertura").css('visibility', 'visible');

                if(localStorage.getItem('area') === 'GARANTIA' || localStorage.getItem('area') === 'ADMINISTRADOR'){
                  $("#bCierre").css('visibility', 'visible');
                }
              } 

              for (let index = 0; index < datos.length; index++) {
                if(datos[index]['estado'] === 'PENDIENTE' && datos[index]['area'] === 'TALLER'){
  
                  document.getElementById('bMotivo-'+datos[index]['fila']).addEventListener('click', async(x) => {
                    //alert(datos[index]['idDet'])

                    let res = prompt('Ingrese el nuevo diagnostico de la pieza '+datos[index]['repuesto']+' por favor:')
                    if(res){

                      await fetch(URL+'/garantia-upd-det-motivo/' + datos[index]['idDet'], {
                        method: "POST",
                        body: JSON.stringify({motivo: res.toUpperCase()}),
                        headers: {"Content-type": "application/json; charset=UTF-8"}
                      })
                      .then(json => {
                        alert('Datos modificados correctamente !!!')
                        window.location.reload()
                      })
                      .catch(err => {console.log(err)
                        alert('hubo un error en la actualizacion !!')
                      })

                    }
                  })
                }
              }

              datos.forEach(item=>{
                document.getElementById('det-'+item.idDet).addEventListener('dblclick', async(x) => {
                  if($("#estado").val() == 'RECHAZADO'){
                    let dato = JSON.parse(localStorage.getItem("detalle-solicitud"))
                    let pieza = dato.find(item2 => item2.idDet === item.idDet)                    
                    alert(JSON.stringify(pieza))
                    if(confirm(" Desea asignar como pieza causal al repuesto "+ pieza.repuesto +" del incidente "+pieza.incidente+" ?")){
                      
                      //this.actualizarDetallePiezaCausal(pieza.nro, pieza.idDet, {piezaCausal:'SI'})
                      await fetch(URL + "/garantia-upd-det" + `/${pieza.nro}/${pieza.idDet}`, {
                        method: "POST",
                        body: JSON.stringify({piezaCausal:'SI'}),
                        headers: {"Content-type": "application/json; charset=UTF-8"}
                      })
                      .then(response => response.json()) 
                      .then(json => {
                        alert('Se actualizo el detalle !!!')
                        this.recuperarSolicitud()
                      })
                      .catch(err => console.log(err));                      
                    }
                  }
                })
              })

              $("#siSolicitud").css('display', 'inline');
              $("#noSolicitud").css('display', 'none');
              if($("#estado").val() == 'PENDIENTE' || $("#estado").val() == 'ESPERA' || $("#estado").val() == 'MODIFICADO' ){
                $("#estado").attr('class', 'form-control bg-warning');
              }else if ($("#estado").val() == 'NUEVO' ){
                $("#estado").attr('class', 'form-control bg-info');

              }else if ($("#estado").val() == 'APROBADO' || $("#estado").val() == 'ENTREGADO'){
                $("#estado").attr('class', 'form-control bg-success');
              }else if ($("#estado").val() == 'RECHAZADO' ){
                $("#estado").attr('class', 'form-control bg-danger');
              }
              $("#pSolicitud").removeClass('progress-bar-striped progress-bar-animated bg-warning').addClass("bg-success");
              //ver si no tiene la firma del jefe taller y jefe garantia... 
              $("#pTaller").addClass('progress-bar-striped progress-bar-animated bg-warning');
              if ($("#estado").val() == 'PENDIENTE') {
                if(localStorage.getItem('area') == 'JEFE GRUPO' || localStorage.getItem('area') == 'ADMINISTRADOR'){ 
                  $("#bSolicitar").prop("disabled", false);
                  $("#bSolicitarPieza").prop("disabled", false);
                  $("#bServicioTercero").prop("disabled", false);
                    
                }else{
                  $("#bSolicitar").prop("disabled", true);
                  $("#bSolicitarPieza").prop("disabled", true);
                  //$("#bServicioTercero").prop("disabled", true);
                }
              }else{
                $("#bSolicitar").prop("disabled", true);
                $("#bSolicitarPieza").prop("disabled", true);
                //$("#bServicioTercero").prop("disabled", true);
              }

            }
          })
          .then(x=>{
            //para controlar las aprobaciones para garantia...
            this.aprobaciones()

            if($("#estado").val() !=="NUEVO"){
              $("#bSolicitar").text("Actualizar")
            }else{
              $("#bSolicitar").text("Solicitar")

            }
          })


        })
        .fail(() => {
          //this.spinner(0); 
          console.error('hubo un error al traer los datos.. ');
        });

    }
    //controlar aprobaciones para garantia...
    this.aprobaciones()
  }

  //funcion para realizar las aprobaciones de la solicitud 
  aprobaciones(){
     
      //
      if(localStorage.getItem('area') === 'GARANTIA' || localStorage.getItem('area') === 'ADMINISTRADOR'){

        $("#bRechazar").css('visibility', 'visible')
        $("#bEspera").css('visibility', 'visible')
        $("#bAprobar").css('visibility', 'visible')

      }else{
        $("#bRechazar").css('visibility', 'hidden')
        $("#bEspera").css('visibility', 'hidden')
        $("#bAprobar").css('visibility', 'hidden')
      }

      //
      if($("#area").val() === 'GARANTIA' && ( $("#estado").val() === 'PENDIENTE' || $("#estado").val() === 'ESPERA' ) ){

        $('#bRechazar').prop('disabled', false);
        $('#bEspera').prop('disabled', false);
        $('#bAprobar').prop('disabled', false);
      }else{
        $('#bRechazar').prop('disabled', true);
        $('#bEspera').prop('disabled', true);
        $('#bAprobar').prop('disabled', true);
      }
    
  }


async  actualizarDetallePiezaCausal(idCab:string, idDet:string , datos:Object){
    await fetch(URL + `/garantia-upd-det/${idCab}/${idDet}`, {
      method: "POST",
      body: JSON.stringify(datos),
      headers: {"Content-type": "application/json; charset=UTF-8"}
    })
    .then(response => {
        alert('se actualizo el detalle !!')
        this.recuperarSolicitud()
    })
    .catch(err => console.log(err));

  }

  async reapertura() {
    let res = prompt('Ingrese el Motivo de la apertura por favor:')
    if(res){
      const valor = {
        usuario:localStorage.getItem('user'),
        estado: $("#estado").val(),
        id:$("#id").val(),
        motivo: res,
        area: $("#area").val(),
      }
  
      await fetch(URL+'/garantia-aprobacion', {
        method: "POST",
        body: JSON.stringify(valor),
        headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      .then(json => {
        alert('Solicitud Enviada correctamente !!!')
      })
      .then(async(x)=>{
        var valor = {id: $('#id').val(), estado: 'PENDIENTE', area: 'GARANTIA'} 
        await fetch(URL + `/garantia-upd-cab`, {
          method: "POST",
          body: JSON.stringify(valor),
          headers: {"Content-type": "application/json; charset=UTF-8"}
        })
        .catch(err => console.log(err))        
      })
      .then(async(x)=>{
        await fetch(URL  +`/telegram-send?chat_id=-916962805&mensaje=TALLER ${localStorage.getItem('nombre')} ha solicitado la apertura de la solicitud nro OT ${$("#ot").val()} motivo: \n ${res}` )
        .then(response => response.json())  // convertir a json
        .then(json => console.log('se envio telegram....'))
        .catch(err => console.log('Solicitud fallida', err)); // Capturar errores    
        this.websocket.emit('refrescar-pendientes', {msg: 'ok'})             
      })
      .then(x=>{
        window.location.reload()

      })
      .catch(err => {console.log(err)
        alert('hubo un error en la reapertura !!')
      })

    }   

  }

  async cierre() {
    let res = prompt('Ingrese el Motivo del cierre por favor:')
    if(res){
      const valor = {
        usuario:localStorage.getItem('user'),
        estado: 'CERRADO',
        id:$("#id").val(),
        motivo: res,
        area: 'TALLER',
      }
  
      await fetch(URL + '/garantia-aprobacion', {
        method: "POST",
        body: JSON.stringify(valor),
        headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      .then(json => {
        alert('Solicitud Cerrada correctamente !!!')
      })
      .then(async(x)=>{
        var valor = {id: $('#id').val(), estado: 'CERRADO', area: 'TALLER'} 
        await fetch(URL + "/garantia-upd-cab", {
          method: "POST",
          body: JSON.stringify(valor),
          headers: {"Content-type": "application/json; charset=UTF-8"}
        })
        .catch(err => console.log(err))        
      })
      .then(async(x)=>{
        await fetch(URL +`/telegram-send?chat_id=-916962805&mensaje=TALLER ${localStorage.getItem('nombre')} ha cerrado la solicitud nro OT ${$("#ot").val()} motivo: \n ${res}` )
        .then(response => response.json())  // convertir a json
        .then(json => console.log('se envio telegram....'))
        .catch(err => console.log('Solicitud fallida', err)); // Capturar errores    
        this.websocket.emit('refrescar-pendientes', {msg: 'ok'})             
      })
      .then(x=>{
        window.location.reload()

      })
      .catch(err => {console.log(err)
        alert('hubo un error en la reapertura !!')
      })

    }   

  }


  solicitarPieza() {
    var incidente = $("#incidente").val().toUpperCase();
    var pieza = $("#piezaSolicitada").val().toUpperCase();
    var motivo = $("#motivoReclamo").val().toUpperCase();
    var reparacion = $("#reparacion").val().toUpperCase();
    var cantidad = $("#cantidad").val();
    var registros = $("#piezasSolicitadas tr").length;

    var piezaCauzal = $( "#piezaCausal:checked" ).length > 0 ? 'SI' : '' 

    if (pieza.trim().length == 0 || motivo.trim().length == 0 || reparacion.trim().length == 0 || incidente.trim().length == 0) {
      swal.fire('Ingrese todos los campos !!', '', 'warning');
      return;
    }
    if ($("tr:contains(" + pieza + ")").length > 0) {
      swal.fire('Ya existen esos registros en la tabla !!', '', 'warning');
      //return;
    }
    var fila = "", valor = "", id = "";
    valor = (registros + 1); //nro de la fila
    fila = '<tr id="f' + valor + '" class="pl-1 pr-1" nuevo="si" >';
    fila += "<td>" + valor + "</td>"; // fila 
    fila += "<td>" + cantidad + "</td>"; // cantidad 
    fila += "<td>" + incidente.trim() + "</td>"; // pieza solicitada 
    fila += "<td>" + pieza.trim() + "</td>"; // pieza solicitada 
    fila += "<td>" + motivo.trim() + "</td>"; // motivo reclamo 
    fila += "<td>" + reparacion.trim() + "</td>"; // descripcion de la reparacion  
    fila += "<td>" + piezaCauzal + "</td>"; // descripcion de la reparacion  
    if( $("#estado").val() == 'PENDIENTE'){
      fila += '<td style=" font-size:18px;"> <span class="badge badge-warning"> <strong>MODIFICADO</strong> </span> </td>'; // Estado 
    }else{
      fila += '<td style=" font-size:18px;"> <span class="badge badge-warning"> <strong>NUEVO</strong> </span> </td>'; // Estado 
    }
    fila += '<td></td><td></td>'
    fila += '<td style="text-align: center;" class="pl-1 pr-1"> <button type="button" id="b' + valor + '" class="btn btn-danger btn-sm" > <i class="fa fa-trash-alt" aria-hidden="true"></i></button> </td>';
    fila += "</tr>";
    document.getElementById("piezasSolicitadas").innerHTML += fila;
    //$("#incidente").val('');
    $("#piezaSolicitada").val('');
    $("#motivoReclamo").val('');
    $("#reparacion").val('');
    $("#piezaSolicitada").focus();
    $('#piezaCausal').prop('checked', false);
    registros = $("#piezasSolicitadas tr").length;
    for (let index = 0; index < registros; index++) {
      if ($("#piezasSolicitadas tr")[index].getAttribute("nuevo") == 'si') {
        document.getElementById('b'+ (index +1 )).addEventListener('click', () => { this.delFila(index + 1) }); 
      }
    }
  }

  delFila(fila) {
    console.log('ingreso para eliminar fila.. ', fila);
    $('#f' + fila + '').remove();

  }

  async listo(){
      var valor = {id: $('#id').val(), estado: 'PENDIENTE', area: 'GARANTIA'} 
      await fetch(URL + `/garantia-upd-cab`, {
        method: "POST",
        body: JSON.stringify(valor),
        headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      //.then(response => response.json()) 
      .then( async( json) => {
        alert('Datos actualizados !!!')

        this.websocket.emit('solicitud', { mensaje: 'El '+ localStorage.getItem('area') +' '+ localStorage.getItem('nombre') +' ha modificado una solicitud OT Nro ' + $("#ot").val() + ' !!!', para: localStorage.getItem('user'), area: $("#area").val() });
        this.websocket.emit('refrescar-pendientes', {msg: 'ok'})
        await fetch(URL +`/telegram-send?chat_id=${-916962805}&mensaje=${localStorage.getItem('nombre')} ha modificado solicitud nro OT ${$("#ot").val()} \n ${URL}/garantia/Solicitud/${$("#ot").val()} `)
          .then(response => response.json())  // convertir a json
          .then(json => console.log('se envio telegram....'))
          .then(json =>{
            this.recuperarSolicitud()
          })
          .catch(err => console.log('Solicitud fallida', err)); // Capturar errores 
          
        //this.recuperarSolicitud()
      })
      .catch(err => console.log(err))
  }

  async solicitar() {

    //si alguien habilitado 
    if ($("#estado").val() == 'PENDIENTE') {
      //debe agregar almenos un registro para insertar ... 
      if( $("#piezasSolicitadas tr[nuevo=si]").length==0 ){
        this.listo()
        //swal.fire('Debe agregar un registro en el detalle !!!','', 'warning');
        return ;
      }
      var valor = [];
      /*valor.push( {name: 'id' , value: $('#id').val()}, 
                  {name: 'estado', value: 'MODIFICADO'} 
                ); */
      var valor2 = {id: $('#id').val(), estado: 'PENDIENTE', area: 'GARANTIA'} 
      var promesa = new Promise((resolve , reject )=>{
        $.post(URL + `/garantia-upd-cab`, valor2)
        .done(function (valor) {
          //insertar el detalle 
          var detalle = [];
          var tbl = $("#piezasSolicitadas tr"), celda: any;
          for (let index = 0; index < tbl.length; index++) {
            //solo si es nuevo registro va a insertar en el base de datos... 
            if ($("#piezasSolicitadas tr")[index].getAttribute("nuevo") == 'si') {
              celda = tbl[index].getElementsByTagName('td');
              detalle.push(
                { name: 'cantidad', value: celda[1].innerHTML },
                { name: 'incidente', value: celda[2].innerHTML },
                { name: 'repuesto', value: celda[3].innerHTML },
                { name: 'motivo', value: celda[4].innerHTML },
                { name: 'reparacion', value: celda[5].innerHTML },
                { name: 'piezaCausal', value: celda[6].innerText },
                { name: 'estado', value: celda[7].innerText },
                { name: 'parent', value: $('#id').val() },
              );
            }
          }
          console.log(detalle);
    
          $.post(URL + `/garantia-ins-det`, detalle)
            .done(function (data) {
              console.log('inserto detalle ... ');
              console.log(data);
              swal.fire('Datos Grabados correctamente...');
              $("#bSolicitar").prop("disabled", true);
              $("#bSolicitarPieza").prop("disabled", true);
              $("#bServicioTercero").prop("disabled", true);
              //Push.default.create('Se modifico la Solicitud Nro ' + $('#id').val() );
              resolve(1);
            })
            .fail(function (err ) {
              console.log("error al actualizar cab... ", err ,'error' );
              swal.fire("error al actualizar cab... ", err ,'error' );
              return ;
            });
  
        })
        .fail(function (err) {
          swal.fire("error al actualizar cab... ", err ,'error' );
          reject(0);
          return ;
        });
      });    
      promesa
      .then((value)=>{
        this.recuperarSolicitud();
      })       
      .then((value)=>{
        //caso que haya grabado todo !!! 
        this.websocket.emit('solicitud', { mensaje: 'El '+ localStorage.getItem('area') +' '+ localStorage.getItem('nombre') +' ha modificado una Solicitud de la OT Nro '+ $('#ot').val() +' !!! ',para: localStorage.getItem('user') , area :  $('#area').val()});
      });
  
    } else {
      //si es nuevo el registro 
      if ($("#vdn").val().trim().length == 0) {
        swal.fire('Debe ingresar el VDN de la solicitud !!!', '', 'warning');
        $("#vdn").focus();
        return;
      }

      if ($("#mecanico").val().trim().length == 0) {
        swal.fire('Debe ingresar el nombre del mecanico !!!', '', 'warning');
        $("#mecanico").focus();
        return;
      }

      if ($("#tipoGarantia").val().trim().length == 0) {
        swal.fire('Debe ingresar Tipo de Garantia !!!', '', 'warning');
        $("#tipoGarantia").focus();
        return;
      }

      if ($("#piezasSolicitadas tr").length == 0) {
        swal.fire('Debe ingresar registros en el Detalle !!', '', 'warning');
        $("#piezasolicitada").focus();
        return;
      }

      //controlamos si ya adjunto las fotos a la solicitud 
      await fetch(URL + '/garantia-fotos/' + $("#ot").val())
      .then(response => response.json())  // convertir a json
      .then(json => {
        console.log('tiene imagenes... ',json)
        if(json?.foto === '' ){
          alert('Atencion, Olvido adjuntar imagenes que respalden la solicitud indicando el nro de OT al cual corresonde!!!')
        }
      })
      .catch(err => console.log('Solicitud fallida', err)); // Capturar errores

      var valor = $("#form1").serializeArray();
      console.log(valor)
      //agregar el usuario loggeado 
      valor.push({ name: 'usuario', value: localStorage.getItem('user') });
      //console.log('valores del array.. ');
      //console.log(valor);
      var promesa = new Promise((resolve , reject )=>{

      $.post(URL + `/garantia-ins-cab`, valor)
        .done(function (data) {
          //sapo..
          console.log('inserto la cabecera... ');
          console.log(data['rows'][0]['id']);
          //insertar el detalle 
          var detalle = [];
          var tbl = $("#piezasSolicitadas tr"), celda: any;
          for (let index = 0; index < tbl.length; index++) {
            celda = tbl[index].getElementsByTagName('td');
            detalle.push(
              { name: 'cantidad', value: celda[1].innerHTML },
              { name: 'incidente', value: celda[2].innerHTML },
              { name: 'repuesto', value: celda[3].innerHTML },
              { name: 'motivo', value: celda[4].innerHTML },
              { name: 'reparacion', value: celda[5].innerHTML },
              { name: 'piezaCausal', value: celda[6].innerText },
              { name: 'estado', value: celda[7].innerText },
            { name: 'parent', value: data['rows'][0]['id'] },
            );
          }
    
          $.post(URL + `/garantia-ins-det`, detalle)
            .done(function (data) {
              console.log('inserto detalle ... ');
              console.log(data);
              swal.fire('Datos Grabados correctamente...');
              $("#bSolicitar").prop("disabled", true);
              $("#bSolicitarPieza").prop("disabled", true);
              $("#bServicioTercero").prop("disabled", true);
              //Push.default.create('Existe una Nueva Solicitud !!!');
              resolve(1);
            })
            .fail(function () {
              alert('error al grabar detalle.. ');
              return ;
            });
        })
        .fail(function () {
          alert("error al grabar cab... ");
          reject(0);
          return ;
        })
      });
      promesa
      .then((value)=>{
        this.recuperarSolicitud();
      })
      .then((value)=>{
        //caso que haya grabado todo ..... 
        this.websocket.emit('solicitud', { mensaje: 'El '+ localStorage.getItem('area') +' '+ localStorage.getItem('nombre') +' ha creado una nueva solicitud para la OT Nro ' + $("#ot").val() + ' !!!', para: localStorage.getItem('user'), area: $("#area").val() });
      })
      .then(async(value)=>{
        // Solicitud GET (Request).
        await fetch(URL +`/telegram-send?chat_id=${-916962805}&mensaje=${localStorage.getItem('nombre')} ha creado una nueva solicitud nro OT ${$("#ot").val()} \n ${URL}/garantia/Solicitud/${$("#ot").val()} `)
          // Exito
          .then(response => response.json())  // convertir a json
          .then(json => console.log('se envio telegram....'))    //imprimir los datos en la consola
          .catch(err => console.log('Solicitud fallida', err)); // Capturar errores    
        })
    }

  }

  async agregarServicioTercero2(){
    //swal.fire('Nuevo Servicio', '' , 'info')

    const form = `
        <form id="form-ta">
        <div class="row">
          <div class="col-sm-12 ">
            <input type="text" class="form-control" placeholder="Taller?" id="taller-ta"  required>
          </div>                      
        </div>
        <div class="row mt-2">
            <div class="col-sm-5 ">
              <input type="text" class="form-control" placeholder="Fecha ddmmaaaa" id="fecha-ta"  mask="00-00-0000" required>
            </div>
            <div class="col-sm-7 ml-0">
              <input type="text" class="form-control" placeholder="Km entrada.." id="kilometraje-ta" mask="separator.0" thousandSeparator="." separatorLimit="200000" required>
            </div>
        </div>
          <div class="d-flex mt-2">
          <select class="form-control" id="service-ta">
          <option value=""><b>km Servicio</b></option>
          <option value="5000">5000 km</option>
          <option value="10000">10000 km</option>
          <option value="15000">15000 km</option>
          <option value="20000">20000 km</option>
          <option value="25000">25000 km</option>
          <option value="30000">30000 km</option>
          <option value="35000">35000 km</option>
          <option value="40000">40000 km</option>
          <option value="45000">45000 km</option>
          <option value="50000">50000 km</option>
          <option value="55000">55000 km</option>
          <option value="60000">60000 km</option>
          <option value="65000">65000 km</option>
          <option value="70000">70000 km</option>
          <option value="75000">75000 km</option>
          <option value="80000">80000 km</option>
          <option value="85000">85000 km</option>
          <option value="90000">90000 km</option>
          <option value="95000">95000 km</option>
          <option value="100000">100000 km</option>
          <option value="105000">105000 km</option>
          <option value="110000">110000 km</option>
          <option value="115000">115000 km</option>
          <option value="120000">120000 km</option>
          <option value="125000">125000 km</option>
        </select>
          <button type="button" id="bServicioTercero-ta" (click)="agregarLinea()" class="btn btn-primary ml-1 mb-1"
            style="position: relative; float: right; border-radius:10px;">
            <i class="fa fa-plus-circle fa-lg" aria-hidden="true"></i>
            </button>
          </div>
      </form> 
      <table class="table table-bordered table-striped table-sm table-hover text-nowrap mb-5 mt-2">
      <thead>
        <tr>
          <th>Nro</th>
          <th>Fecha</th>
          <th>Service</th>
          <th>Km</th>
          <th>Taller</th>
        </tr>
      </thead>
      <tbody id="detServicioTercero-ta">
      </tbody>
    </table>
    <div class="row">
    <div class="col-sm-12 ">
      <button type="button" class="btn btn-success m-0" id="btInsertar" style="visibility:hidden;"> Listo </button>
    </div>                      
  </div>    
    `
    swal.fire({
      title: `Servicios Terceros`,
      showCloseButton: true,
      showCancelButton: false,
      showConfirmButton: false,
      html: form,
    })
    localStorage.setItem('servicios-terceros',  JSON.stringify([]) );  
    document.getElementById("bServicioTercero-ta").addEventListener('click', () => this.agregarLinea() )
    document.getElementById("btInsertar").addEventListener('click', async() => {
      //insertamos los datos y si estan correctos lo mostramos en pantalla... 
      let datos = JSON.parse( localStorage.getItem('servicios-terceros'))
      if(datos.length > 0 ){
        datos.forEach(item=> delete item.id)
        //supersapo
        await fetch(URL + `/garantia-ins-ser-ter`, {
          method: "POST",
          body: JSON.stringify(datos),
          headers: {"Content-type": "application/json; charset=UTF-8"}
        })
        .then(response => response.json()) 
        .then(json =>{
          alert('Datos grabados correctamente !!!')
          swal.close()
          this.recuperarServiciosTerceros()
        } )
        .catch(err => {
          alert('Hubo un error al grabar los datos ' + err )
          console.log('hubo un error el grabar los servicios terceros ', err)
        });
            
      }else{
        alert('No existen registros para actualizar la lista!!')
      }
    })
    
  }

  agregarLinea(){
    //controlamos la carga 
    if ($("#fecha-ta").val().length == 0 || $("#kilometraje-ta").val().length == 0 || $("#service-ta").val() == 0  || $("#taller-ta").val().length == 0){
      alert('Debe ingresar valores en los campos requeridos...!! \nEjemplo: \n Taller: KTM\n Fecha: 20240101 \n Km Entrada: 15250 \n Km Servicio: 15000 km.' );
      return;
    }

    var item = $('#detServicioTercero-ta tr').length + 1 ;
    if (item <= 4 ){
      var fila = '<tr id="fst'+item+'">'+
                    '<td>'+ item +'</td>'+
                    '<td>'+ $("#fecha-ta").val() +'</td>'+
                    '<td>'+ $("#service-ta").val() +'</td>'+
                    '<td>'+ $("#kilometraje-ta").val() +'</td>'+
                    '<td>'+ $("#taller-ta").val() +'</td>'+
                    '<td  style="text-align: center;" class="pl-1 pr-1">'+ 
                      '<button type="button" class="btn btn-danger btn-sm m-0" id="bst'+item+'"> <i class="fa fa-trash-alt" aria-hidden="true"></i> </button>' 
                    +'</td>'+
                  '</tr>';
      let datos = {
        id: item,
        fecha: $("#fecha-ta").val() ,
        servicio:$("#service-ta").val()  ,
        kilometraje: $("#kilometraje-ta").val() ,
        taller:$("#taller-ta").val()  ,
        ot: $("#ot").val() ,
        user_ins: localStorage.getItem('user')
      }
      let valor = JSON.parse(localStorage.getItem('servicios-terceros'))
      console.log('items ', valor)
      if(valor.length === 0 ){
        localStorage.setItem('servicios-terceros', JSON.stringify([datos]) );  
      }else{
        valor.push( datos )
        localStorage.setItem('servicios-terceros', JSON.stringify(valor) );  
      }
      $('#detServicioTercero-ta:first').append(fila); 
      $("#fecha-ta").val('');
      $("#kilometraje-ta").val('');
      $("#service-ta").val('');
      $("#taller-ta").val('');
      $("#taller-ta").focus();
      $("#btInsertar").css('visibility', 'visible');
      document.getElementById('bst'+ item ).addEventListener('click', () => { this.delServicioTercero(item) });
    }
  }

  agregarServicioTercero (){
    console.log('entro para agregar el servicio tercero... ');

    //control de los campos a ingresar 
    if ($("#fechaST").val().length == 0 || $("#kilometrajeST").val().length == 0 || $("#servicioST").val() == 0  || $("#tallerST").val().length == 0){
      swal.fire('Debe ingresar valores en los campos requeridos... ', '' , 'warning');
      return ;
    }

    var taller = $("#tallerST").val().toUpperCase();
    var fecha = $("#fechaST").val();
    var kilometraje = $("#kilometrajeST").val();
    var servicio = $("#servicioST").val() + ' KM';

    $("#fechaST").val('');
    $("#kilometrajeST").val('');
    $("#servicioST").val('');
    $("#fechaST").focus();
    var item = $('#detServicioTercero tr').length + 1 ;
    if (item <= 4 ){
      var fila = '<tr id="fst'+item+'">'+
                    '<td>'+ item +'</td>'+
                    '<td>'+ fecha +'</td>'+
                    '<td>'+ servicio +'</td>'+
                    '<td>'+ kilometraje +'</td>'+
                    '<td>'+ taller +'</td>'+
                    '<td  style="text-align: center;" class="pl-1 pr-1">'+ '<button type="button" class="btn btn-danger btn-sm m-0" id="bst'+item+'"> <i class="fa fa-trash-alt" aria-hidden="true"></i> </button>' +'</td>'+
                  '</tr>';
      $('#detServicioTercero:first').append(fila); 
      document.getElementById('bst'+ item ).addEventListener('click', () => { this.delServicioTercero(item) });
      /** para agregar boton dinamico y agregar el evento ...*/
      /*
      for (let index = 0; index < item; index++) {
        //if ($("# tr")[index].getAttribute("nuevo") == 'si') {
          document.getElementById('bst'+ (index +1 )).addEventListener('click', () => { this.delServicioTercero(index + 1) }); 
        //}
      }*/
      $('#bInsertarServicioTercero').css('display', 'block');
    }else{
      swal.fire('Solo hasta cuatro items se puede agregar en el listado !!!','','warning');
    }
    
  }

  delServicioTercero(id){
    //swal.fire('Eliminar registro !!' + id , '', 'error');
    $("#fst" + id).remove();
    if ( $('#detServicioTercero tr button').length === 0 ){
      //$('#bInsertarServicioTercero').css('display', 'none');
      $('#btInsertar').css('visibility', 'hidden');
    }
    let datos = JSON.parse(localStorage.getItem('servicios-terceros'))
    datos = datos.filter(item=> item.id !== id)
    localStorage.setItem('servicios-terceros',JSON.stringify(datos))
  }

 async insertarServicioTercero(){
 
    var detalle = [];
    var tbl = $("#detServicioTercero tr") , celda: any;

    for (let index = 0; index < tbl.length; index++) {
      celda = tbl[index].getElementsByTagName('td');
      console.log(celda)
      if(celda[5].innerHTML.length > 0){
        detalle.push(
          { fecha: celda[1].innerHTML ,
           servicio: celda[2].innerHTML ,
           kilometraje: celda[3].innerHTML ,
           taller: celda[4].innerHTML ,
           ot: $("#ot").val() ,
           user_ins: localStorage.getItem('user')
          },
        );
      }      
    }
    console.log(detalle)
    await fetch(URL + `/garantia-ins-ser-ter`, {
      method: "POST",
      body: JSON.stringify(detalle),
      headers: {"Content-type": "application/json; charset=UTF-8"}
    })
    .then(response => response.json()) 
    .then(json =>{
      swal.fire('Datos grabados correctamente')
      console.log(json)
      $('#bInsertarServicioTercero').css('display', 'none')
      this.recuperarServiciosTerceros()
      $("#formSer").trigger("reset");
    } )
    .catch(err => {
      swal.fire('Hubo un error al grabar los datos ' + err )
      console.log('hubo un error el grabar los servicios terceros ', err)
    });


  }

  async recuperarServiciosTerceros(){
    $('#detServicioTercero > *').remove()    
    // Solicitud GET (Request).
    await fetch(URL +'/garantia-ser-ter/'+ $("#ot").val())
      // Exito
      .then(response => response.json())  // convertir a json
      .then(json =>{
        console.log(json)
        var fila =''
        if(json.length > 0){
          json.forEach((item,x) =>{
              fila += '<tr id="fst'+item.id+'">'+
              '<td>'+ (x +1) +'</td>'+
              '<td>'+ item.fecha +'</td>'+
              '<td>'+ item.servicio +'</td>'+
              '<td>'+ item.kilometraje +'</td>'+
              '<td>'+ item.taller +'</td>'+
              //'<td  style="text-align: center;" class="pl-1 pr-1"></td>'+
            '</tr>';
          })
          //$('#detServicioTercero:first').append(fila); 
          $('#detServicio').append(fila);
          //detServicio          
          
        }
      } )    //imprimir los datos en la consola
      .catch(err => console.log('Solicitud fallida', err)); // Capturar errores
  }

  async guardarMob(){
    let datos = G_listMob.map(item=>{ delete(item.id)
      return {...item, user_ins : localStorage.getItem('user') , ot: $("#ot").val()}
    })
    try {
      await fetch(URL +`/garantia-mob`, {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      .then(async(x) => {

        alert('Se grabo la mano de obra con exito!')
        G_listMob = []
        $("#detalleMob").empty()
        this.recuperarMob()
      })
      .catch((e)=>{
        alert("Ocurrio un Error al grabar los datos... ")
        console.log('hubo un error al grabar mano de obra ' , e)
      })
      
    } catch (error) {
      console.log('hubo un error al grabar la mano de obra... ', error )      
    }
  }
    
  async recuperarMob(){
    try {

      if(localStorage.getItem('area') !== 'GARANTIA' && localStorage.getItem('area') !== 'ADMINISTRADOR'){
        $("#abm-mob").css('display', 'none');
      } 

      $("#bGuardarMob").css('display','none')
      
        await fetch(URL +`/garantia-mob/${$("#ot").val()}`)
        .then(res => res.json())
        .then(rows=>{
          console.log(rows)
          let detalleMob = rows.map((item,x)=> `<tr id='mob-${x+1}'> 
            <td>${item.codigo}</td>
            <td>${item.descripcion}</td>
            <td>${item.cantidad}</td>
            <td>${item.estado}</td>
            <td class="pl-1 pr-1 text-center"></td>
          </tr>` )
          $("#detalleMob").append(detalleMob)

        })
      } catch (error) {
      console.log('hubo un error al recuperar la mano de obra ', error )
    }
  }

  async agregarMob(){
    if($("#codigoMob").val().length === 0 || $("#descripcionMob").val().length === 0 || $("#cantidadMob").val().length === 0){alert('Debe ingresar datos en los campos de codigo - descripcion - cantidad'); return } 
    let listMob = [] 
    listMob.push({codigo: $("#codigoMob").val() , descripcion: $("#descripcionMob").val(), cantidad: $("#cantidadMob").val(), estado: 'NUEVO' })
    let fila = $('#detalleMob').find('tr').length + 1
    G_listMob.push({id: `mob-${fila}`, codigo: $("#codigoMob").val(), descripcion: $("#descripcionMob").val(), cantidad:$("#cantidadMob").val(), estado: 'NUEVO' })
    let detalleMob = listMob.map((item,x)=> `<tr id='mob-${fila}'> 
                                          <td>${item.codigo}</td>
                                          <td>${item.descripcion}</td>
                                          <td>${item.cantidad}</td>
                                          <td>${item.estado}</td>
                                          <td class="pl-1 pr-1 text-center"><button type="button" id='bFilaMob-${fila}' class="btn btn-danger btn-sm m-0" > <i class="fa fa-trash-alt" aria-hidden="true"></i> </button></td>
                                        </tr>` )
    $("#detalleMob").append(detalleMob)
  
    //para eliminar filas 
    document.getElementById(`bFilaMob-${fila}`).addEventListener("click", async ()=>{
      G_listMob = G_listMob.filter(item=> item.id !== 'mob-'+fila)
      console.log(G_listMob)
      document.getElementById('mob-'+fila).remove()
      if (  G_listMob.length ===0 )  $("#bGuardarMob").css('display', 'none')
    })


    if(document.getElementById(`bGuardarMob`).getAttribute('listener') === 'false' ){
      document.getElementById(`bGuardarMob`).setAttribute('listener', 'true')
      //para guardar mob
      // document.getElementById(`bGuardarMob`).addEventListener("click", async ()=>{
      //   alert('guardar mob')
      // })
    }
  
    $("#codigoMob").val('')
    $("#descripcionMob").val('')
    $("#cantidadMob").val('')
    $("#codigoMob").focus()
    $("#bGuardarMob").css('display', 'block')
    console.log('mano de obra ... ', G_listMob)
}

async campanha(){
  try {
   
      await fetch(URL +`/garantia-campanha/${$("#vin").val()}`)
      .then(res => res.json())
      .then(rows=>{
        if(rows.length === 0 ){ 
          $("#sin-campanha").html(`SIN CAMPAÑAS...`); 
          $("#table-campanha").css('display', 'none'); 
          return  
        }
        let detalle = rows.map((item,x)=> `<tr id='mob-${x+1}'> 
          <td>${item.OT}</td>
          <td>${item.ESTADO.includes('COMPLETED') ? `<h5><span class="label bg-success rounded">${item.ESTADO}</span></h5>` : `<h5>Example <span class="label bg-danger rounded">${item.ESTADO}</span></h5>` }</td>
          <td>${item.CODIGO}</td>
          <td>${item.TRABAJO}</td>
        </tr>` )
        $("#det-campanha").html(detalle)

        let table = `
        <div class="table-responsive" style="border-radius: 5px;">
          <table class="table table-striped table-sm table-hover text-nowrap mb-3">
            <thead>
              <tr>
                <th>Ot</th>
                <th>Estado</th>
                <th>Campaña</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${detalle}
            </tbody>
          </table>
        </div>
        `
        swal.fire({
          title: `<strong>CAMPAÑAS</strong>`,
          showCloseButton: true,
          showConfirmButton: false,
          html: table ,
          width: '100%',
        })

      })
    } catch (error) {
    console.log('hubo un error al recuperar la mano de obra ', error )
  }
}

async actualizarCierre(){
  if($("#fechaCierre").val().length === 0 && $("#kmCierre").val().length ===0 ){alert('Debe ingresar datos de Fecha Cierre y Km de Cierre'); return } 
    await fetch(URL+'/garantia-upd-cab-new/' + $("#ot").val() , {
      method: "POST",
      body: JSON.stringify({fechaCierre: $("#fechaCierre").val().replaceAll('-', '') , kmCierre: $("#kmCierre").val() }),
      headers: {"Content-type": "application/json; charset=UTF-8"}
    })
    .then(json => {
      alert('Datos modificados correctamente !!!')
      window.location.reload()
    })
    .catch(err => {console.log(err)
      alert('hubo un error en la actualizacion !!')
    })

}


async ultimasGarantias(){
  try {

    
      await fetch(URL +`/garantia-ultima-garantia/${$("#vin").val()}`)
      .then(res => res.json())
      .then(rows=>{

        if(rows.length === 0 ){ $("#sin-garantia").append(`SIN REGISTROS DE GARANTIAS...`); $("#table-garantia").css('display', 'none') }

        let detalle = rows.map((item,x)=> `<tr id='mob-${x+1}'> 
          <td>${item.ot}</td>
          <td>${item.fecha}</td>
          <td>${item.pedido}</td>
        </tr>` )
        $("#det-garantia").html(detalle)

      })
    } catch (error) {
    console.log('hubo un error al recuperar la mano de obra ', error )
  }
}

async clienteMora(){
  try {
      $("#cliente-mora").html('Recuperando datos mora...')
      await fetch(URL +`/garantia-mora/${$("#vin").val()}`)
      .then(res => res.json())
      .then(rows=>{

        if(rows.length === 0 ){
          $("#cliente-mora").html('CLIENTE AL DIA !!')
        } else{

          swal.fire({
            title: `<strong>Estado de Cliente</strong>`,
            showCloseButton: true,
            showConfirmButton: false,
            html: ` <h3><span class="badge bg-danger"> CLIENTE CON ${rows[0]['mora']} DIAS DE MORA</span></h3>  `,
          })

          $("#cliente-mora").html(`<h5><span class="badge bg-danger"> CLIENTE CON ${rows[0]['mora']} DIAS DE MORA</span></h5>`)
        }

      })
    } catch (error) {
    console.log('hubo un error al recuperar la mano de obra ', error )
  }
}


  async linkCM(){
    // Solicitud GET (Request).
    await fetch(URL +`/garantia-fotos/`+ $("#ot").val())
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
              imagenes += ` <img class="img-fluid rounded" onClick="this.classList.toggle('zoom-img')" id="foto-${x}" src="${item}" alt="" width="200" height="200" data-toggle="tooltip" data-placement="top" title=""> \n`
            }

          })
          console.log(imagenes)
          console.log(indicador)
          let pantalla = `
            <style>
            .zoom-img {
              z-index: 100;
              position:relative;
              height: auto;
              width: auto;
            }
            </style>          
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
            await fetch(URL + `/garantia-descargar-fotos/${$("#ot").val()}`)
            .then(response => response.blob())
            .then(blob => {
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = `${$("#ot").val()}.zip`;
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

 
  keyPress(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
        // invalid character, prevent input
        event.preventDefault();
    }
  } 

  async accion(evento:string){
    if(evento === 'aprobar'){
      await this.subAprobar('GARANTIA' , $("#id").val() , 'APROBADO', localStorage.getItem('user'), $("#ot").val())
      window.location.reload()
    }else if(evento === 'espera'){
      await this.subAprobar('GARANTIA' , $("#id").val() , 'PENDIENTE', localStorage.getItem('user'), $("#ot").val())
      window.location.reload()
    }else if (evento === 'rechazar'){
      await this.subAprobar( 'GARANTIA' , $("#id").val() , 'RECHAZADO', localStorage.getItem('user'), $("#ot").val())
      window.location.reload()
    }
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
      // var tbl = $("#TD"+ solicitud +" tr").has('td') , celda : any; 
      // for (let index = 0; index < tbl.length; index++) {
      //   //si el valor es diferente a la seleccion del usuario actualiza el detalle ... 
      //   // el atributo valor es una variable que trae por defecto y podra comparar con innertext del item..
      //   if($("#D" + solicitud + (index + 1)).text() != $("#D" + solicitud + (index + 1)).attr('valor') ){
      //     datos.push({name: 'idDet', value: $("#D" + solicitud + (index + 1)).attr('iddet') });
      //   }
      //   console.log( 'valor del contenido ',  $("#D" + solicitud + (index + 1)).text() + 'valor defecto ', $("#D" + solicitud + (index + 1)).attr('valor') );
      // }

      //si se rechaza tiene otro tratamiento... 
    if(estado == 'RECHAZADO'){
      //si es rechazado debe ingresar un motivo por el rechazo
      var motivo = prompt("INGRESE MOTIVO RECHAZO !!!" );
      if(motivo == null ) return ;
      if(motivo.length == 0){
        swal.fire('No ingreso ningun motivo !!!');
        return ;
      }
      datos.push({name: 'motivo' , value: motivo });

    }else if(estado == 'ESPERA'){
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
    // }else if(estado == 'ENTREGADO'){ 
    //   if($("#TD"+solicitud+" tbody tr:contains(ESPERA)").length > 0 ){ 
    //     alert('Existen item en Espera actualice el estado del item de espera a Aprobado !! '); 
    //     return; 
    //   } 
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
      //this.buscar(0);
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

}