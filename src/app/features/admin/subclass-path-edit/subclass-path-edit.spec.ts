import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SubclassPathEdit } from './subclass-path-edit';

describe('SubclassPathEdit', () => {
  let fixture: ComponentFixture<SubclassPathEdit>;
  let component: SubclassPathEdit;
  let httpMock: HttpTestingController;

  const mockPathResponse = {
    id: 1,
    name: 'Path of the Blade',
    associatedClass: { id: 10, name: 'Warrior' },
    associatedClassId: 10,
    expansionId: 1,
  };

  const mockSubclassCards = {
    content: [
      {
        id: 100,
        name: 'Blade Initiate',
        description: 'Foundation level card',
        level: 'FOUNDATION',
        subclassPathId: 1,
        associatedClassId: 10,
        expansionId: 1,
        isOfficial: true,
        features: [],
        costTags: [],
      },
      {
        id: 101,
        name: 'Blade Specialist',
        description: 'Specialization level card',
        level: 'SPECIALIZATION',
        subclassPathId: 1,
        associatedClassId: 10,
        expansionId: 1,
        isOfficial: true,
        features: [],
        costTags: [],
      },
      {
        id: 102,
        name: 'Blade Master',
        description: 'Mastery level card',
        level: 'MASTERY',
        subclassPathId: 1,
        associatedClassId: 10,
        expansionId: 1,
        isOfficial: true,
        features: [],
        costTags: [],
      },
    ],
    currentPage: 0,
    totalPages: 1,
    totalElements: 3,
    pageSize: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SubclassPathEdit],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { pathId: '1' } },
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SubclassPathEdit);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set pathId from route params on init', () => {
    fixture.detectChanges();
    expect(component.pathId()).toBe(1);
  });

  it('should load path and subclass cards on init', () => {
    fixture.detectChanges();

    const pathReq = httpMock.expectOne(req =>
      req.url.includes('/dh/subclass-paths/1')
    );
    pathReq.flush(mockPathResponse);

    const cardsReq = httpMock.expectOne(req =>
      req.url.includes('/dh/cards/subclass') && req.params.get('subclassPathId') === '1'
    );
    cardsReq.flush(mockSubclassCards);

    expect(component.pathName()).toBe('Path of the Blade');
    expect(component.className()).toBe('Warrior');
    expect(component.levels().length).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('should order levels as Foundation, Specialization, Mastery', () => {
    fixture.detectChanges();

    httpMock.expectOne(req => req.url.includes('/dh/subclass-paths/1')).flush(mockPathResponse);
    httpMock.expectOne(req => req.url.includes('/dh/cards/subclass')).flush(mockSubclassCards);

    const levels = component.levels();
    expect(levels[0].level).toBe('FOUNDATION');
    expect(levels[1].level).toBe('SPECIALIZATION');
    expect(levels[2].level).toBe('MASTERY');
  });

  it('should default active tab to FOUNDATION', () => {
    fixture.detectChanges();

    httpMock.expectOne(req => req.url.includes('/dh/subclass-paths/1')).flush(mockPathResponse);
    httpMock.expectOne(req => req.url.includes('/dh/cards/subclass')).flush(mockSubclassCards);

    expect(component.activeTab()).toBe('FOUNDATION');
  });

  it('should switch active tab', () => {
    fixture.detectChanges();

    httpMock.expectOne(req => req.url.includes('/dh/subclass-paths/1')).flush(mockPathResponse);
    httpMock.expectOne(req => req.url.includes('/dh/cards/subclass')).flush(mockSubclassCards);

    component.setActiveTab('MASTERY');
    expect(component.activeTab()).toBe('MASTERY');
  });

  it('should show load error on failure', () => {
    fixture.detectChanges();

    httpMock.expectOne(req => req.url.includes('/dh/subclass-paths/1'))
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(component.loadError()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should handle partial levels (only foundation exists)', () => {
    fixture.detectChanges();

    httpMock.expectOne(req => req.url.includes('/dh/subclass-paths/1')).flush(mockPathResponse);
    httpMock.expectOne(req => req.url.includes('/dh/cards/subclass')).flush({
      ...mockSubclassCards,
      content: [mockSubclassCards.content[0]],
      totalElements: 1,
    });

    expect(component.levels().length).toBe(1);
    expect(component.levels()[0].level).toBe('FOUNDATION');
  });
});
