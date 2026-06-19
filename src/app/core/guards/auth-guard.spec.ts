import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue('URL_TREE' as never);
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/my-trips' } as RouterStateSnapshot),
    );

  it('allows access when logged in', () => {
    TestBed.inject(AuthService).login({ email: 'a@b.com', password: 'x' });
    expect(runGuard()).toBe(true);
  });

  it('redirects to /login with returnUrl when logged out', () => {
    expect(runGuard()).toBe('URL_TREE' as never);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/my-trips' },
    });
  });
});
