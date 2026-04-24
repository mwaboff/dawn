import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminUserService } from './admin-user.service';
import { AdminUserDetailResponse, AdminUserListResponse } from '../models/admin-user.model';
import { environment } from '../../../../environments/environment';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/admin/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists users with all filter params', () => {
    service.listUsers({
      page: 1,
      size: 50,
      sort: 'username',
      ascending: true,
      isBanned: true,
      role: 'USER',
      username: 'al',
      email: 'a@b',
    }).subscribe();

    const req = httpMock.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.get('sort')).toBe('username');
    expect(req.request.params.get('ascending')).toBe('true');
    expect(req.request.params.get('isBanned')).toBe('true');
    expect(req.request.params.get('role')).toBe('USER');
    expect(req.request.params.get('username')).toBe('al');
    expect(req.request.params.get('email')).toBe('a@b');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 50 } as AdminUserListResponse);
  });

  it('gets a single user with expand=all', () => {
    service.getUser(7).subscribe();
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/7`);
    expect(req.request.params.get('expand')).toBe('all');
    req.flush({ user: { id: 7, username: 'a', role: 'USER', banned: false, createdAt: '' }, identities: [] } as AdminUserDetailResponse);
  });

  it('patches a user', () => {
    service.updateUser(7, { username: 'new' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ username: 'new' });
    req.flush({ user: { id: 7, username: 'new', role: 'USER', banned: false, createdAt: '' }, identities: [] });
  });

  it('bans a user with reason', () => {
    service.banUser(7, 'spam').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7/ban`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'spam' });
    req.flush({ user: { id: 7, username: 'a', role: 'USER', banned: true, createdAt: '' }, identities: [] });
  });

  it('bans a user with empty body when reason omitted', () => {
    service.banUser(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7/ban`);
    expect(req.request.body).toEqual({});
    req.flush({ user: { id: 7, username: 'a', role: 'USER', banned: true, createdAt: '' }, identities: [] });
  });

  it('unbans a user', () => {
    service.unbanUser(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7/unban`);
    expect(req.request.method).toBe('POST');
    req.flush({ user: { id: 7, username: 'a', role: 'USER', banned: false, createdAt: '' }, identities: [] });
  });

  it('propagates 403 errors', () => {
    let captured: unknown;
    service.getUser(7).subscribe({ error: (e) => (captured = e) });
    const req = httpMock.expectOne(`${baseUrl}/7?expand=all`);
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect((captured as { status: number }).status).toBe(403);
  });

  it('propagates 404 errors', () => {
    let captured: unknown;
    service.getUser(99).subscribe({ error: (e) => (captured = e) });
    const req = httpMock.expectOne(`${baseUrl}/99?expand=all`);
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    expect((captured as { status: number }).status).toBe(404);
  });
});
