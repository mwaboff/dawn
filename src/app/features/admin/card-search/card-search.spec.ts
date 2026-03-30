import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { CardSearch } from './card-search';
import { ClassService } from '../../../shared/services/class.service';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

describe('CardSearch', () => {
  let component: CardSearch;
  let fixture: ComponentFixture<CardSearch>;
  let router: Router;

  const mockCards: CardData[] = [
    { id: 1, name: 'Warrior', description: 'A fighter', cardType: 'class' },
    { id: 2, name: 'Wizard', description: 'A mage', cardType: 'class' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSearch],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CardSearch);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show category pills', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const pills = compiled.querySelectorAll('.category-pill');
    expect(pills.length).toBeGreaterThan(0);
  });

  it('should show empty message when no category selected', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const emptyMessage = compiled.querySelector('.search-empty');
    expect(emptyMessage?.textContent).toContain('Select a category');
  });

  it('should set active category on pill click', () => {
    fixture.detectChanges();
    const classService = TestBed.inject(ClassService);
    vi.spyOn(classService, 'getClasses').mockReturnValue(of(mockCards));

    component.onCategorySelected('class');
    expect(component.activeCategory()).toBe('class');
  });

  it('should filter cards by search query', () => {
    fixture.detectChanges();
    const classService = TestBed.inject(ClassService);
    vi.spyOn(classService, 'getClasses').mockReturnValue(of(mockCards));

    component.onCategorySelected('class');
    fixture.detectChanges();

    component.onSearchChange('war');
    const filtered = component.filteredCards();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Warrior');
  });

  it('should navigate on card selection', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.activeCategory.set('class');

    component.onCardSelected(mockCards[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/cards', 'class', 1]);
  });

  it('should clear search query on category change', () => {
    fixture.detectChanges();
    const classService = TestBed.inject(ClassService);
    vi.spyOn(classService, 'getClasses').mockReturnValue(of(mockCards));

    component.onSearchChange('test');
    expect(component.searchQuery()).toBe('test');

    component.onCategorySelected('class');
    expect(component.searchQuery()).toBe('');
  });
});
