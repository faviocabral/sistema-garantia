import { TestBed } from '@angular/core/testing';

import { ConectadosService } from './conectados.service';

describe('ConectadosService', () => {
  let service: ConectadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConectadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
