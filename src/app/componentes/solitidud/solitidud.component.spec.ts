import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolitidudComponent } from './solitidud.component';

describe('SolitidudComponent', () => {
  let component: SolitidudComponent;
  let fixture: ComponentFixture<SolitidudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SolitidudComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolitidudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
