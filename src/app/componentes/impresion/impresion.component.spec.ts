import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpresionComponent } from './impresion.component';

describe('ImpresionComponent', () => {
  let component: ImpresionComponent;
  let fixture: ComponentFixture<ImpresionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpresionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpresionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
