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

const URL = localStorage.getItem('url');
let G_listMob = []
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
      $("#bSolicitar").text("Actualizar")
      //this.notificacion.getToken();// trae el token que genero el usuario... 
      //this.notificacion.sendPush('Garantia', 'Nueva Solicitud de ' + String(ot) );
      //las notificaciones se van a enviar desde el servidor 

       
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
       
          $.get(URL + "/garantia-solicitudes?ot=" + ot +"&usuario="+ usuario +"&area="+ area, async function (data, status) {
            //si ya existe la solicitud recuperar los datos.. 
            if (data['rows'].length > 0) {
              var datos = data['rows'];
              console.log(datos)
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
              //$("#jefeGrupo").val(datos[0]['jefeGrupo']);//se recupera de la primera fila .

              $("#vdn").attr('readonly', true);
              $("#tipoGarantia").attr("disabled", true); 
              $("#mecanico").attr("disabled", true); 
              $("#sintoma").attr("disabled", true); 
              document.querySelector('#piezasSolicitadas').innerHTML = body;

              if( ($("#area").val() == 'GARANTIA' && $("#estado").val() == 'APROBADO') || $("#area").val() == 'REPUESTO' ){
                $("#bReapertura").css('visibility', 'visible');
                $("#bCierre").css('visibility', 'visible');
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
      $('#bInsertarServicioTercero').css('display', 'none');
    }

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
              '<td  style="text-align: center;" class="pl-1 pr-1"></td>'+
            '</tr>';
          })
          $('#detServicioTercero:first').append(fila); 
          
        }
      } )    //imprimir los datos en la consola
      .catch(err => console.log('Solicitud fallida', err)); // Capturar errores
  }

  async guardarMob(){
    alert(JSON.stringify(G_listMob))
  }
  
  
  async agregarMob(){
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
      if (  $('#detalleMob').find('tr').length === 0 )  $("#bGuardarMob").css('display', 'none')
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

}