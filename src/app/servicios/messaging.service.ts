import { Injectable , InjectionToken, Injector } from '@angular/core';
import firebase from 'firebase'
//import { AngularFireMessaging } from '@angular/fire/messaging';
import { BehaviorSubject } from 'rxjs'
import {environment} from '../../environments/environment';
import { MessagePayload } from './notification-interfaces';
import { HttpClient  , HttpHeaders} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { stringify } from '@angular/compiler/src/util';
import * as $ from '../../../node_modules/jquery';
import { send } from 'process';
import { SwPush } from '@angular/service-worker';
import * as io from 'socket.io-client';


@Injectable({
  providedIn: 'root'
})
export class MessagingService {
//https://www.youtube.com/watch?v=sgmkJs2nCSU
//https://github.com/jimyhdolores/demo-web-push-notification-firebase/blob/master/src/app/app.component.ts
//push local 
//https://www.youtube.com/watch?v=HlYFW2zaYQM
//https://thecodebarbarian.com/sending-web-push-notifications-from-node-js
//constructor(swPush: SwPush){
  //const publicVapidKey = 'BH2aGsR4IIyP1UWs-ERaFftJqLgKoF_eurAbzpOv2VYjydjgR5tQBIW6TcyAPAnLHv2nY4mGZ3hdV0hlZC6IGNg';
  
  //if('serviceWorker' in navigator){
  //  this.send().catch(err => console.error(err));
  //}
//}


async send(){
  console.log('registring service worker');
  const register = await navigator.serviceWorker.register('/worker.js', {
    scope: '/'
  });
  console.log('registred servicewoker.. ');
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true , 
    applicationServerKey: 'BH2aGsR4IIyP1UWs-ERaFftJqLgKoF_eurAbzpOv2VYjydjgR5tQBIW6TcyAPAnLHv2nY4mGZ3hdV0hlZC6IGNg'
  })
}


   //messagingFirebase: firebase.messaging.Messaging;
   token: any;
  currentMessage = new BehaviorSubject(null);
  constructor(private http: HttpClient){

    //firebase.initializeApp(environment.firebase);
    //this.messagingFirebase = firebase.messaging();

  }
/*
  requestPermission = () => {
    return new Promise(async (resolve, reject) => {
      const permsis = await Notification.requestPermission();
      if (permsis === "granted") {
        const tokenFirebase = await this.messagingFirebase.getToken();
        localStorage.setItem('userToken', tokenFirebase);
        this.token = tokenFirebase;
        resolve(tokenFirebase);
      } else {
        reject(new Error("No se otorgaron los permisos"))
      }
    })
  }

  private messaginObservable = new Observable<MessagePayload>(observe => {
    this.messagingFirebase.onMessage(payload => {
      observe.next(payload)
    })
  })

  receiveMessage() {
    return this.messaginObservable;
  }

  getToken(){
    this.token;
    console.log('consulta token ..  ', this.token);
  }


  sendPush(titulo, mensaje){
    var msg= [];
    msg.push(
      { name: 'titulo' , value: titulo },
      {  name: 'mensaje' , value: mensaje },
      {  name: 'token' , value: this.token } 
    );

    $.post( "http://192.168.10.54:3010/garantia-push", msg)
    .done(function(data) {
      console.log('se envio push firebase ');
    })
    .fail(function(error) {
      console.log('hubo un error al enviar push firebase ' , error );
    });

  }
  
  
  sendPush(titulo , msg ){
    //console.log('entro para enviar push...'  , this.token ); 
    var _token: string; 
    _token = String(localStorage.getItem('userToken'));
//    _token = String(this.token);
    console.log(' como trae el token.. ',_token);
    //titulo = 'Garantia'; 
    //msg = 'Nueva solicitud !!!'; 
    const header = new HttpHeaders() 
    .set('Content-Type', 'application/json')
    .set('Authorization', 'key=AAAAGma6bhg:APA91bFt0y4-OGfysI6Jb0lkGOo3ToyPWxu4bu7-gNzpVP2NtlACUSJGOeyYsnrS8CdOqM0P1KBEn9d4Lik2RhVvsJjx3CORDPB7dSNkdTY5Y1jxdajJXUeprVr8BHu9grG3TaL97enT');
    //"to": "cPVPkLK0GQA970DKo-2DT3:APA91bFEir4zvvV5SD3sWN4iPFdhalk7jTOn7BkoxgetxuKJlH_sbOLDrdjlLcw9PfYbivU4ER3UAc3iK84pWItgErmaZx4UX7QFgKXHTo3w695-aWCpfYZc_Iwc_a_VdlyW6D09TiIH" ,

    const body = { 
      "to": _token ,
      "notification": {
       "title": titulo, 
       "body": msg 
      } 
    };
    var envio = this.http.post('https://fcm.googleapis.com/fcm/send', body, { headers: header })
    .subscribe(
      val => {
          console.log("PUT call successful value returned in body", 
                      val);
      },
      response => {
          console.log("Post call in error", response);
      },
      () => {
          console.log("The Post observable is now completed.");
      }
  );
    console.log(envio);
  }

*/

  enviar(){
    const header = new HttpHeaders() 
    .set('Content-Type', 'application/json')
    .set('Authorization', 'Bearer 7f331ae0234d3d41ce36ac188e350e22265bdcb21c8c748bb05613a756f4f3da')
    .set('Access-Control-Allow-Origin', 'http://localhost:4200');

    const body = { 
      "users": ["1473"],
      "web": {
        "notification": {
          "title": "Notificacion de Garantias",
          "body": "prueba mas!"
        }
      } 
    };


    var envio = this.http.post('https://landing-page-demo.pushnotifications.pusher.com/publish_api/v1/instances/beb6f539-ed11-4a61-a2ea-845292c64db1/publishes/users', body, { headers: header })
    .subscribe(
      val => {
          console.log("PUT call successful value returned in body", 
                      val);
      },
      response => {
          console.log("Post call in error", response);
      },
      () => {
          console.log("The Post observable is now completed.");
      }
  );
    console.log(envio);


/*
    curl -X POST "https://landing-page-demo.pushnotifications.pusher.com/publish_api/v1/instances/beb6f539-ed11-4a61-a2ea-845292c64db1/publishes/users" \
    -H "Authorization: Bearer 7f331ae0234d3d41ce36ac188e350e22265bdcb21c8c748bb05613a756f4f3da" \
    -H "Content-Type: application/json" \
    -d '{
      "users": ["1473"],
      "web": {
        "notification": {
          "title": "Notificacion de Garantias",
          "body": "prueba mas!"
        }
      }
    }'
 */



  }


}
