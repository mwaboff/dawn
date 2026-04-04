import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch a user by id', () => {
    service.getUser(42).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/users/42');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 42, username: 'testuser' });
  });

  it('should fetch user character sheets with ownerId param', () => {
    service.getUserCharacterSheets(42).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/character-sheets' &&
        r.params.get('ownerId') === '42' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '100'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], currentPage: 0, pageSize: 100, totalElements: 0, totalPages: 0 });
  });

  it('should include expand param when provided', () => {
    service.getUserCharacterSheets(42, 0, 100, 'subclassCards').subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/character-sheets' &&
        r.params.get('expand') === 'subclassCards'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], currentPage: 0, pageSize: 100, totalElements: 0, totalPages: 0 });
  });

  it('should use custom page and size params', () => {
    service.getUserCharacterSheets(42, 2, 25).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/character-sheets' &&
        r.params.get('page') === '2' &&
        r.params.get('size') === '25'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], currentPage: 2, pageSize: 25, totalElements: 0, totalPages: 0 });
  });
});
