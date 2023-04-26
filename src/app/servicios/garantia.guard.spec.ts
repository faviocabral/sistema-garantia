import { TestBed } from '@angular/core/testing';

import { GarantiaGuard } from './garantia.guard';

describe('GarantiaGuard', () => {
  let guard: GarantiaGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(GarantiaGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
