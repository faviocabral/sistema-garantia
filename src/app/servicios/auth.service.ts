import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginInfo: BehaviorSubject<boolean>; 
  public loginInfo2= true; 
  constructor() { 
    this.loginInfo = new BehaviorSubject<boolean>(false); 
  }

  getValue(): Observable<boolean> { 
    return this.loginInfo.asObservable(); 
  }
  setValue(newValue): void {
    this.loginInfo.next(newValue);
  }

}
