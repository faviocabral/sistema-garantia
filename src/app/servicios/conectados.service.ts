import { Injectable } from '@angular/core';
import * as $ from '../../../node_modules/jquery';

@Injectable({
  providedIn: 'root'
})
export class ConectadosService {

  constructor() { }


  online(){
    setTimeout(function(){
      //alert('paso 2 ');
      var html = 
      '<li class="nav-item">' +
        '<a class="nav-link">'+
          '<i class="far fa-circle nav-icon text-success"></i>'+
          '<p>'+ String(localStorage.getItem('nombre')).toUpperCase() +'</p>'+
        '</a>'+
      '</li>';
      if( localStorage.getItem('area') == 'ADMINISTRADOR'){
        //document.getElementById('ucAdministrador').className='menu-open';
        $("#uAdministrador").append(html);

      }else if (localStorage.getItem('area') == 'GARANTIA'){
        console.log('ingreso para garantia.... ');
       // document.getElementById('ucGarantia').className='menu-open';
        $("#uGarantia").html(html);

      }else if (localStorage.getItem('area') == 'JEFE GRUPO'){
        //document.getElementById('ucGrupo').className='menu-open';
        $("#uGrupo").append(html);

      }else if (localStorage.getItem('area') == 'JEFE TALLER'){
        //document.getElementById('ucTaller').className='menu-open';
        $("#uTaller").append(html);
      }else if (localStorage.getItem('area') == 'REPUESTO'){
        //document.getElementById('ucRepuesto').className='menu-open';
        $("#uRepuesto").append(html);

      }
    }, 2000);



  }
}
