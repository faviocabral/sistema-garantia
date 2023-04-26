import { Injectable } from '@angular/core';
//import { observable } from 'rxjs/Observable';
//import 'rxjs/add/observable/of';
//import 'rxjs/add/operator/map';
import { of,BehaviorSubject, Observable  } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  private isloggedIn: boolean;
  private userName:string;
  constructor() { 
    this.isloggedIn=false;
  }

  login(username: string, area: string , nombre : string , chat_id : number ) {
    //Assuming users are provided the correct credentials.
    //In real app you will query the database to verify.
    localStorage.setItem('isloggedIn', 'true');
    localStorage.setItem('user', username );
    localStorage.setItem('nombre', nombre );
    localStorage.setItem('area', area );
    localStorage.setItem('chat_id', String( chat_id ) );
    this.isloggedIn=true;
    this.userName=username; 
    return of(this.isloggedIn); 
  }

  isUserLoggedIn(): boolean {
    if (localStorage.getItem('isloggedIn') == 'true' || this.isloggedIn){
      return true;
    }else {
      return false;
    } 
    //return this.isloggedIn;
  }

  logoutUser(): void{
    this.isloggedIn = false;
    localStorage.setItem('isloggedIn', 'false');
    localStorage.setItem('user', '');
    localStorage.setItem('area', '');
    localStorage.setItem('nombre', '' );


  }  

}
