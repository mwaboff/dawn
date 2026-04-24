import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserList } from './user-list';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUserListResponse } from '../models/admin-user.model';

function makeResponse(overrides: Partial<AdminUserListResponse> = {}): AdminUserListResponse {
  return {
    content: [
      { id: 1, username: 'alice', role: 'USER', banned: false, createdAt: '2026-01-01T00:00:00', avatarUrl: null },
      { id: 2, username: 'bob', role: 'USER', banned: true, createdAt: '2026-01-02T00:00:00', avatarUrl: null },
    ],
    totalElements: 2,
    totalPages: 1,
    currentPage: 0,
    pageSize: 50,
    ...overrides,
  };
}

describe('UserList', () => {
  let component: UserList;
  let fixture: ComponentFixture<UserList>;
  let adminUserService: AdminUserService;
  let listSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserList);
    component = fixture.componentInstance;
    adminUserService = TestBed.inject(AdminUserService);
    listSpy = vi.spyOn(adminUserService, 'listUsers').mockReturnValue(of(makeResponse()));
  });

  it('loads users on init', () => {
    fixture.detectChanges();
    expect(component.users().length).toBe(2);
    expect(listSpy).toHaveBeenCalled();
  });

  it('renders banned pill for banned users', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const pills = compiled.querySelectorAll('.user-pill--banned');
    expect(pills.length).toBe(1);
  });

  it('navigates to edit page when Edit clicked', () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.onEdit(42);
    expect(navSpy).toHaveBeenCalledWith(['/admin/users', 42]);
  });

  it('resets page to 0 when filters change', async () => {
    listSpy.mockReturnValue(of(makeResponse({ totalPages: 3, currentPage: 0 })));
    fixture.detectChanges();
    component.page.set(2);
    listSpy.mockClear();

    component.filtersForm.patchValue({ username: 'al' });
    await new Promise(r => setTimeout(r, 350));
    expect(listSpy).toHaveBeenCalled();
    const lastCallArg = listSpy.mock.calls.at(-1)?.[0] as { page: number };
    expect(lastCallArg.page).toBe(0);
  });

  it('handles error response', () => {
    listSpy.mockReturnValue(throwError(() => ({ error: { message: 'forbidden' } })));
    fixture.detectChanges();
    expect(component.error()).toBe('forbidden');
  });

  it('disables Prev on first page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const prev = compiled.querySelector('.page-btn') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });
});
