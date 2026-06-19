import { TestBed } from '@angular/core/testing';
import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TripService);
  });

  it('returns all trips', () => {
    expect(service.getAll().length).toBeGreaterThan(0);
  });

  it('finds a trip by id', () => {
    expect(service.getById('trip-1')?.destination).toBe('Paris');
  });

  it('returns undefined for an unknown id', () => {
    expect(service.getById('does-not-exist')).toBeUndefined();
  });

  it('assigns every activity a unique id', () => {
    const ids = service
      .getAll()
      .flatMap((trip) => trip.days.flatMap((day) => day.activities.map((a) => a.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
