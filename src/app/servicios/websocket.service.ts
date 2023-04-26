import { Injectable } from '@angular/core';
//import * as io from 'socket.io-client';
import {io} from 'socket.io-client/build';
import { Observable, Subscriber } from 'rxjs';
import * as $ from '../../../node_modules/jquery';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  socket: any;
  uri: string = 'http://192.168.10.54:3010';
//readonly uri: string = 'http://192.168.10.54:3080';

  constructor() { 
    var servidor = window.location.origin;
    if (servidor.indexOf('localhost') >0  ){
      this.uri = "http://192.168.10.54:3010";
    }else{
      this.uri = servidor;
    }

    const socketio = io(this.uri);
    this.socket = socketio;
  }

  listen(eventName : string ){
    return new Observable((Subscriber) => {
      this.socket.on(eventName, (data)=>{
        Subscriber.next(data);
      })
    });
  }

  emit(eventName : string, data: any ){
    this.socket.emit(eventName , data );
  };

  telegram(chat_id , mensaje){
    var servidor = window.location.origin; 
    var url = "" ; 
    if (servidor.indexOf('localhost') >0 ){
      url = "http://192.168.10.54:3010/telegram-send?chat_id=" + chat_id +"&mensaje="+ mensaje; 
    }else{
      url = servidor + "/telegram-send?chat_id=" + chat_id +"&mensaje="+ mensaje; 
    }
    $.get(url, function (data, status) {
      console.log('estado de la consulta ', status); 
      console.log(data); 
    })    
    .done((data) => {
      console.log('se envio notificacion telegram');
    })
    .fail((err) => {
      console.log('no se pudo enviar notificacion telegram');
      //this.spinner(0); 
      console.error('hubo un error al traer los datos.. ' , err ); 
    }); 
  }
  
}
