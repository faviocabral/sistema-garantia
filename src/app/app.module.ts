import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { animate, state, style, transition, trigger } from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import {environment} from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './componentes/login/login.component';
import { TableroComponent } from './componentes/tablero/tablero.component';
import { PendientesComponent } from './componentes/pendientes/pendientes.component';
import { NgxUiLoaderModule } from  'ngx-ui-loader';
import { SpinnerComponent } from './componentes/spinner/spinner.component';
import { SolitidudComponent } from './componentes/solitidud/solitidud.component';

import { AngularFireMessagingModule , AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule  } from '@angular/fire';
import { MessagingService } from './servicios/messaging.service';
//import { AsyncPipe } from '../../node_modules/@angular/common';
import { ServiceWorkerModule, SwUpdate, SwPush, SwRegistrationOptions } from '@angular/service-worker';
import { HttpClientModule } from '@angular/common/http';
import {AuthGuardService } from '../app/servicios/auth-guard.service';
import { LoginService } from './servicios/login.service';
import { UsuariosComponent } from './componentes/usuarios/usuarios.component';
import {WebsocketService } from '../app/servicios/websocket.service';
import { ReportesComponent } from './componentes/reportes/reportes.component';
import { NgxMaskModule, IConfig } from 'ngx-mask';
import { ImpresionComponent } from './componentes/impresion/impresion.component'

export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    TableroComponent,
    PendientesComponent,
    SpinnerComponent,
    SolitidudComponent,
    UsuariosComponent,
    ReportesComponent,
    ImpresionComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot({ 
      positionClass: 'toast-bottom-right', 
      //preventDuplicates: true, 
      progressBar: true,
      disableTimeOut: true

    }), // ToastrModule added 
    NgxUiLoaderModule,
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFireMessagingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: true}),
    AngularFireModule.initializeApp(environment.firebase),  
    //ServiceWorkerModule.register('ngsw-worker.js'), ServiceWorkerModule.register('ngsw-worker.js', { enabled: true }),
    ServiceWorkerModule.register('ngsw-worker.js'), ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    HttpClientModule, 
    NgxMaskModule.forRoot(),
  ],
  providers: [
      AngularFireMessaging,
      //MessagingService, 
      AuthGuardService, 
      LoginService,
      WebsocketService 
       /*,
      AsyncPipe,
      {
        provide: SwRegistrationOptions,
        useFactory: () => ({ enabled: environment.production }),      
      }
      */
      ],
  bootstrap: [AppComponent]
})
/** para agregar mascara a los input */
export class AppModule { }
