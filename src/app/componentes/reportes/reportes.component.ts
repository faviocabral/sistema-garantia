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
  
    
      $("#res").pivot(
        [
             {color: "blue", shape: "circle"},
             {color: "red", shape: "triangle"}
         ],
         {
             rows: ["color"],
             cols: ["shape"]
         }
        );
        
         
  }


}
