import { TestBed } from '@angular/core/testing';

import { Cotizacion } from './cotizacion';

describe('Cotizacion', () => {
  let service: Cotizacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cotizacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
