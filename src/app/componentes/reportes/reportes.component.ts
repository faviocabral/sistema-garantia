import { Component, OnInit, ElementRef } from '@angular/core';
import * as $ from '../../../../node_modules/jquery';
import '../../../../node_modules/jquery-ui-dist/jquery-ui.min.css';
import '../../../../node_modules/jquery-ui-dist/jquery-ui.min.js';
import '../../../../node_modules/pivottable/dist/pivot.min.css';
import '../../../../node_modules/pivottable/dist/pivot.min.js';
import * as moment from 'moment'; // add this 1 of 4
import * as io from 'socket.io-client';

import swal from'sweetalert2';
import { Toast, ToastrService } from 'ngx-toastr';
import { WebsocketService } from 'src/app/servicios/websocket.service';

const URL = localStorage.getItem('url');
@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    $("#fechai").val(moment().format('yyyy-MM-01'));
    $("#fechaf").val(moment().format('yyyy-MM-DD'));
  
    
      /*$("#res").pivotUI(
        [
             {color: "blue", shape: "circle"},
             {color: "red", shape: "triangle"}
         ],
         {
             rows: ["color"],
             cols: ["shape"]
         }
        );*/       
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

  async buscar(){
    var fechai = $("#fechai").val();
    var fechaf = $("#fechaf").val();
    
    this.showLoading()
    await fetch(`${URL}/garantia-reportes/${fechai}/${fechaf}`)
    .then(response => response.json())  // convertir a json
    .then(json =>{
      swal.close()//cerrar spin
      if(json.length > 0 ){
        console.log(json)
        let pivotConfig = JSON.parse(localStorage.getItem('pivot-config')) || 
         {
          rows: ["area"],
          cols: ["estado"],
          rendererName: "Table",
          colOrder: "key_a_to_z",
          rowOrder: "key_a_to_z"
        }
        $("#res").pivotUI(json,
           {
            onRefresh: function(config) {
              console.log(config)
              localStorage.setItem('pivot-config', JSON.stringify(
                {
                  rows: config.rows,
                  cols: config.cols,
                  rendererName: config.rendererName,
                  colOrder: config.colOrder,
                  rowOrder: config.rowOrder
                }
              ))
            },            
               rows: pivotConfig?.rows || ["area"],
               cols: pivotConfig?.cols || ["estado"],
               colOrder: pivotConfig?.colOrder || "key_a_to_z",
               rowOrder: pivotConfig?.rowOrder || "key_a_to_z",
               rendererName: pivotConfig?.rendererName || "Table"
           });      
      }else{
        alert('No existen Registros !!!')
      }
    } )    //imprimir los datos en la consola
    .catch(err => {
      swal.close()
      console.log('Solicitud fallida', err)
      alert('Hubo un error en la consulta')
    }); // Capturar errores
  }

}
