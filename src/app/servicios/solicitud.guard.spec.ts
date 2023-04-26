import { TestBed } from '@angular/core/testing';

import { SolicitudGuard } from './solicitud.guard';

describe('SolicitudGuard', () => {
  let guard: SolicitudGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SolicitudGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
