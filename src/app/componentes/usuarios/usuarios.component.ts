import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import * as $ from '../../../../node_modules/jquery';
import * as moment from 'moment'; // add this 1 of 4
import * as io from 'socket.io-client';
import * as Push from 'push.js';
import swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MessagingService } from '../../servicios/messaging.service';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  constructor(private route: ActivatedRoute, private notificacion: MessagingService) { }

  ngOnInit(): void {

   // Push.default.create('Nuevo usuario !!!'); 
    this.recuperar();
    this.telegram_users();
    $("#form1").submit(function(e) {
      e.preventDefault();
    });

  }

  telegram_users(){
    var servidor = window.location.origin; 
    var url = "" ; 
    if (servidor.indexOf('localhost') >0 ){
      url = "http://192.168.10.54:3010/telegram-users";
    }else{
      url = servidor + "/telegram-users";
    }
    $.get(url, function (data, status) {
      console.log('estado de la consulta ', status);
      console.log(data);
    })    
    .done((data) => {
      if (data['rows'].length > 0) {
        var datos = data['rows'];
        var html = "";
        html = '<option value="0"></option>';
        for (let index = 0; index < datos.length; index++) {
          html += '<option value="'+ datos[index]['chat_id'] + '"> '+ datos[index]['first_name'] +' '+ datos[index]['last_name'] +' - '+ datos[index]['username'] +'</option>'; 
        } 
        $("#chat_id").append(html);
      }
    })
    .fail((err) => {
      //this.spinner(0); 
      console.error('hubo un error al traer los datos.. ' , err );
    });    
          
  }

  recuperar(){
    var servidor = window.location.origin; 
    var url = "" ; 
    if (servidor.indexOf('localhost') >0 ){
      url = "http://192.168.10.54:3010/garantia-lista-usuarios"; 
    }else{
      url = servidor + "/garantia-lista-usuarios"; 
    }

    $.get(url, function (data, status) {
      console.log('estado de la consulta ', status);
      console.log(data);
    })    
    .done((data) => {
      
      if (data['rows'].length > 0) {
        var datos = data['rows'];
        var body = "";
        for (let index = 0; index < datos.length; index++) {
          body += '<tr id="F'+ (index + 1) +'">';
          body += '<td>' + datos[index]['fila'] + '</td>' +
            '<td style="vertical-align:middle;">' + datos[index]['nombre'] + '</td>' +
            '<td style="vertical-align:middle;">' + datos[index]['perfil'] + '</td>'+
            '<td style="vertical-align:middle;">' + datos[index]['usuario'] + '</td>';
          if ( datos[index]['estado'].toUpperCase() == 'ACTIVO') {
            body += '<td style="text-align: center;"><span class="badge badge-success">' + datos[index]['estado'] + '</span></td>'
          } else {// cuando es nuevo 
            body += '<td style="text-align: center; vertical-align:middle;"><span class="badge badge-danger">' + datos[index]['estado'] + '</span></td>'
          }
          //si tiene asignado la notificacion de telegram 
          if(datos[index]['chat_id'] == null || datos[index]['chat_id'] == 0 ){
            body += '<td style="vertical-align:middle; text-align:center;" chat="0"><i class="fa fa-question-circle fa-2x text-warning" aria-hidden="true"></i></td>';
          }else{
            body += '<td style="vertical-align:middle; text-align:center;" chat="'+ datos[index]['chat_id'] +'"><i class="fa fa-paper-plane fa-2x text-success" aria-hidden="true"></i></td>';
          }
          body += '<td style="text-align: center; vertical-align:middle;"><button class="btn btn-info btn-sm elevation-1" id="B'+ (index +1) +'" item="'+ datos[index]['id'] +'" pss="'+ datos[index]['pass'] +'" > <i class="fa fa-reply" aria-hidden="true"></i> </button> </td>';

        }
        body += '</tr>';
        document.querySelector('#listadoUsuario').innerHTML = body;

        var registros = $("#listadoUsuario tr").length;
        for (let index = 0; index < registros; index++) {
            document.getElementById('B'+ (index +1 )).addEventListener('click', () => { this.editar( (index + 1 ) ) }); 
        }
    
      }          

    })
    .fail((err) => {
      //this.spinner(0); 
      console.error('hubo un error al traer los datos.. ' , err );
    });    
  }

  editar(fila){

    $("#id").val( $("#B"+ fila).attr("item") );
    $("#nombre").val( $("#F"+ fila +" td")[1].innerText );
    $("#perfil").val( $("#F"+ fila +" td")[2].innerText.toUpperCase() );
    $("#usuario").val( $("#F"+ fila +" td")[3].innerText );
    $("#estado").val( $("#F"+ fila +" td")[4].innerText.toUpperCase());
    $("#pass").val( $("#B"+ fila).attr("pss"));
    $("#chat_id").val( $("#F"+ fila +" td")[5].getAttribute("chat") );

    $("#nombre").attr('readonly', true);
    $("#usuario").attr('readonly', true);
    //$("#perfil").attr('readonly', true);
    $("#abm").text("Modificar");
    $("#nombre").focus();
    
  }

  reset(){
    $("#form1").trigger("reset");
    $("#nombre").attr('readonly', false);
    $("#usuario").attr('readonly', false);
    //$("#perfil").attr('readonly', false);
    $("#abm").text("Crear");
    $("#nombre").focus();
    
  }

  actualizar() {

    var valor = $("#form1").serializeArray();
    var promesa = new Promise((resolve, reject)=> {
      var servidor = window.location.origin; 
      var url = "" ; 
      if (servidor.indexOf('localhost') >0 ){
        url = "http://192.168.10.54:3010/garantia-upd-usuario"; 
      }else{
        url = servidor + "/garantia-upd-usuario"; 
      }
  
      $.post(url, valor)
      .done(function (data) {
        resolve(1);
        swal.fire('Atencion', 'Datos modificados correctamente !!!', 'success');
      })
      .fail(function (err){
        reject(0);
        swal.fire("error al actualizar cab... ", err ,'error' );
        return ;
      });
    })
    .then(value =>{
      this.recuperar();
      this.reset();
    })
  }

  crear(){
    if( $("#abm").text() == 'Modificar'){
      this.actualizar();
      //swal.fire('modificar');
      return ;
    }

    if( 
      $("#nombre").val().trim().length == 0  ||
      $("#usuario").val().trim().length == 0  ||
      $("#pass").val().trim().length == 0  ){
      swal.fire('Atencion','Debe ingresar los campos requeridos !!!', 'warning');
      return ;
    }

    var promesa = new Promise((resolve, reject)=> {

      var valor = $("#form1").serializeArray();
      var servidor = window.location.origin; 
      var url = "" ; 
      if (servidor.indexOf('localhost') >0 ){
        url = "http://192.168.10.54:3010/garantia-ins-usuario"; 
      }else{
        url = servidor + "/garantia-ins-usuario"; 
      }

      $.post(url, valor)
      .done(function (data) {
        swal.fire('Exito', 'Datos grabados correctamente !!!', 'success');
        resolve(1);
      })
      .fail(function (err){ 
        reject(0);
        swal.fire("error al actualizar cab... ", err ,'error' );
        return ;
      });
    })
    .then(value =>{
      this.recuperar();
      this.reset();
    })  
  }

}
