import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentEmail()).toBeNull();
  });

  it('rejects empty credentials', () => {
    expect(service.login({ email: '', password: '' })).toBe(false);
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logs in with valid credentials and persists the session', () => {
    expect(service.login({ email: 'a@b.com', password: 'secret' })).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.currentEmail()).toBe('a@b.com');
    expect(localStorage.getItem('stp_session_email')).toBe('a@b.com');
  });

  it('logs out and clears the session', () => {
    service.login({ email: 'a@b.com', password: 'secret' });
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('stp_session_email')).toBeNull();
  });

  it('signs up with Google (mock) and persists a session', () => {
    expect(service.signInWithGoogle()).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.currentEmail()).toBe('demo.user@gmail.com');
  });
});
