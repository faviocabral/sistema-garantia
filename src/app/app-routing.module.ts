import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImpresionComponent } from './componentes/impresion/impresion.component';
import { LoginComponent } from './componentes/login/login.component';
import { PendientesComponent } from './componentes/pendientes/pendientes.component';
import { ReportesComponent } from './componentes/reportes/reportes.component';
import { SolitidudComponent } from './componentes/solitidud/solitidud.component';
import { TableroComponent } from './componentes/tablero/tablero.component';
import { UsuariosComponent } from './componentes/usuarios/usuarios.component';
import { AuthGuardService } from './servicios/auth-guard.service';
import { GarantiaGuard } from './servicios/garantia.guard';
import { LoginGuardGuard } from './servicios/login-guard.guard';
import { SolicitudGuard } from './servicios/solicitud.guard';

const routes: Routes = [
  { path: 'garantia/Tablero', component: TableroComponent , canActivate:[AuthGuardService, GarantiaGuard]  },
  { path: 'garantia/Login', component: LoginComponent , canActivate: [LoginGuardGuard]},
  { path: 'garantia/Pendientes', component: PendientesComponent, canActivate: [AuthGuardService] },
  { path: 'garantia/Impresion', component: ImpresionComponent, canActivate: [AuthGuardService] },
  { path: 'garantia/Solicitud/:id', component: SolitidudComponent , canActivate:[AuthGuardService, SolicitudGuard] },
  { path: 'garantia/Usuarios', component: UsuariosComponent , canActivate:[AuthGuardService] },
  { path: 'garantia/Reportes', component: ReportesComponent , canActivate:[AuthGuardService] },
  { path: '**', redirectTo: 'garantia/Tablero' }, 
  { path: '', redirectTo: 'garantia/Tablero', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
