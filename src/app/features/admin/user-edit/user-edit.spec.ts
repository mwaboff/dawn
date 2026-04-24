import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserEdit } from './user-edit';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUserDetailResponse } from '../models/admin-user.model';

function makeDetail(overrides: Partial<AdminUserDetailResponse['user']> = {}): AdminUserDetailResponse {
  return {
    user: {
      id: 7,
      username: 'alice',
      role: 'USER',
      banned: false,
      createdAt: '2026-01-01T00:00:00',
      avatarUrl: null,
      email: 'a@x.com',
      ...overrides,
    },
    identities: [{ provider: 'google', linkedAt: '2026-01-01T00:00:00' }],
    loginEvents: [],
    usernameHistory: [],
    adminActions: [],
  };
}

describe('UserEdit', () => {
  let component: UserEdit;
  let fixture: ComponentFixture<UserEdit>;
  let service: AdminUserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEdit],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { userId: '7' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserEdit);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminUserService);
  });

  it('loads user and populates form on init', () => {
    vi.spyOn(service, 'getUser').mockReturnValue(of(makeDetail()));
    fixture.detectChanges();
    expect(component.user()?.username).toBe('alice');
    expect(component.form.get('username')?.value).toBe('alice');
  });

  it('sends only changed fields on save', () => {
    vi.spyOn(service, 'getUser').mockReturnValue(of(makeDetail()));
    const updateSpy = vi.spyOn(service, 'updateUser').mockReturnValue(of(makeDetail({ username: 'alice2' })));
    fixture.detectChanges();

    component.form.patchValue({ username: 'alice2' });
    component.form.markAsDirty();
    component.onSave();

    expect(updateSpy).toHaveBeenCalledWith(7, { username: 'alice2' });
  });

  it('does not call updateUser when nothing changed', () => {
    vi.spyOn(service, 'getUser').mockReturnValue(of(makeDetail()));
    const updateSpy = vi.spyOn(service, 'updateUser');
    fixture.detectChanges();
    component.onSave();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('calls banUser with reason and updates detail', () => {
    vi.spyOn(service, 'getUser').mockReturnValue(of(makeDetail()));
    const banSpy = vi.spyOn(service, 'banUser').mockReturnValue(of(makeDetail({ banned: true, banReason: 'spam' })));
    fixture.detectChanges();

    component.onBan('spam');
    expect(banSpy).toHaveBeenCalledWith(7, 'spam');
    expect(component.user()?.banned).toBe(true);
  });

  it('calls unbanUser', () => {
    vi.spyOn(service, 'getUser').mockReturnValue(of(makeDetail({ banned: true })));
    const unbanSpy = vi.spyOn(service, 'unbanUser').mockReturnValue(of(makeDetail()));
    fixture.detectChanges();
    component.onUnban();
    expect(unbanSpy).toHaveBeenCalledWith(7);
  });

  it('renders identity panel after load', () => {
    vi.spyOn(service, 'getUser').mockReturnValue(of(makeDetail()));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-user-edit-identity-panel')).toBeTruthy();
  });
});
