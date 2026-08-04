import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExperienceSelector } from './experience-selector';

describe('ExperienceSelector', () => {
  let component: ExperienceSelector;
  let fixture: ComponentFixture<ExperienceSelector>;

  function setName(index: number, value: string): void {
    const event = { target: { value } } as unknown as Event;
    component.onNameChange(index, event);
  }

  function setModifier(index: number, value: string): void {
    const event = { target: { value } } as unknown as Event;
    component.onModifierChange(index, event);
  }

  function fillExperience(index: number, name: string, modifier: string): void {
    setName(index, name);
    setModifier(index, modifier);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperienceSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 2 default experience rows', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.experience-row').length).toBe(2);
  });

  it('should initialize with empty experiences', () => {
    const list = component.experienceList();
    expect(list.length).toBe(2);
    expect(list[0]).toEqual({ name: '', modifier: null });
    expect(list[1]).toEqual({ name: '', modifier: null });
  });

  describe('name input', () => {
    it('should update experience name', () => {
      setName(0, 'Blacksmith');
      expect(component.experienceList()[0].name).toBe('Blacksmith');
    });

    it('should emit experiencesChanged on name change', () => {
      const spy = vi.fn();
      component.experiencesChanged.subscribe(spy);
      setName(0, 'Sailor');
      expect(spy).toHaveBeenCalledWith(component.experienceList());
    });
  });

  describe('modifier input', () => {
    it('should update experience modifier', () => {
      setModifier(0, '2');
      expect(component.experienceList()[0].modifier).toBe(2);
    });

    it('should set modifier to null for empty input', () => {
      setModifier(0, '2');
      setModifier(0, '');
      expect(component.experienceList()[0].modifier).toBeNull();
    });

    it('should allow negative modifiers', () => {
      setModifier(0, '-1');
      expect(component.experienceList()[0].modifier).toBe(-1);
    });

    it('should emit experiencesChanged on modifier change', () => {
      const spy = vi.fn();
      component.experiencesChanged.subscribe(spy);
      setModifier(0, '3');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('add experience', () => {
    it('should add a new experience row', () => {
      component.onAddExperience();
      expect(component.experienceList().length).toBe(3);
    });

    it('should add up to 5 experiences', () => {
      component.onAddExperience();
      component.onAddExperience();
      component.onAddExperience();
      expect(component.experienceList().length).toBe(5);
    });

    it('should not add beyond max', () => {
      for (let i = 0; i < 10; i++) component.onAddExperience();
      expect(component.experienceList().length).toBe(5);
    });

    it('should hide add button at max', () => {
      for (let i = 0; i < 3; i++) component.onAddExperience();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.add-btn')).toBeNull();
    });

    it('should emit experiencesChanged on add', () => {
      const spy = vi.fn();
      component.experiencesChanged.subscribe(spy);
      component.onAddExperience();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove experience', () => {
    it('should remove an experience row', () => {
      component.onAddExperience();
      component.onRemoveExperience(0);
      expect(component.experienceList().length).toBe(2);
    });

    it('should not remove below minimum', () => {
      component.onRemoveExperience(0);
      expect(component.experienceList().length).toBe(1);
      component.onRemoveExperience(0);
      expect(component.experienceList().length).toBe(1);
    });

    it('should hide remove buttons at minimum', () => {
      component.onRemoveExperience(0);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.remove-btn')).toBeNull();
    });

    it('should emit experiencesChanged on remove', () => {
      component.onAddExperience();
      const spy = vi.fn();
      component.experiencesChanged.subscribe(spy);
      component.onRemoveExperience(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('isComplete', () => {
    it('should be false when all experiences are empty', () => {
      expect(component.isComplete()).toBe(false);
    });

    it('should be true when name is set because modifier defaults to +2', () => {
      setName(0, 'Blacksmith');
      expect(component.isComplete()).toBe(true);
      expect(component.experienceList()[0].modifier).toBe(2);
    });

    it('should be false when modifier is set but no name', () => {
      setModifier(0, '2');
      expect(component.isComplete()).toBe(false);
    });

    it('should be false when name is whitespace only', () => {
      setName(0, '   ');
      setModifier(0, '1');
      expect(component.isComplete()).toBe(false);
    });

    it('should be true when at least one experience has name and modifier', () => {
      fillExperience(0, 'Blacksmith', '2');
      expect(component.isComplete()).toBe(true);
    });
  });

  describe('completeCount', () => {
    it('should be 0 when no experiences are complete', () => {
      expect(component.completeCount()).toBe(0);
    });

    it('should count experiences with name as complete since modifier defaults to +2', () => {
      fillExperience(0, 'Blacksmith', '2');
      setName(1, 'Incomplete');
      expect(component.completeCount()).toBe(2);
    });

    it('should count multiple complete experiences', () => {
      fillExperience(0, 'Blacksmith', '2');
      fillExperience(1, 'Sailor', '1');
      expect(component.completeCount()).toBe(2);
    });
  });

  describe('input sanitization', () => {
    it('should strip HTML tags and special characters from name', () => {
      setName(0, '<script>alert("xss")</script>');
      expect(component.experienceList()[0].name).toBe('scriptalertxssscript');
    });

    it('should allow letters, numbers, spaces, hyphens, and apostrophes', () => {
      setName(0, "Jack's Ex-Sailor 2nd");
      expect(component.experienceList()[0].name).toBe("Jack's Ex-Sailor 2nd");
    });

    it('should truncate name to 50 characters', () => {
      const longName = 'A'.repeat(60);
      setName(0, longName);
      expect(component.experienceList()[0].name.length).toBe(50);
    });

    it('should clamp modifier to max of 5', () => {
      setModifier(0, '99');
      expect(component.experienceList()[0].modifier).toBe(5);
    });

    it('should clamp modifier to min of -5', () => {
      setModifier(0, '-99');
      expect(component.experienceList()[0].modifier).toBe(-5);
    });

    it('should allow modifiers within range', () => {
      setModifier(0, '3');
      expect(component.experienceList()[0].modifier).toBe(3);
      setModifier(0, '-3');
      expect(component.experienceList()[0].modifier).toBe(-3);
    });

    it('should set nameError when invalid characters are typed', () => {
      setName(0, 'Test<script>');
      expect(component.nameError()).toBeTruthy();
    });

    it('should clear nameError when valid input is typed', () => {
      setName(0, 'Test<script>');
      setName(0, 'Blacksmith');
      expect(component.nameError()).toBeNull();
    });

    it('should render error message for invalid characters', () => {
      setName(0, 'Bad@Input!');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const error = el.querySelector('.name-error');
      expect(error).toBeTruthy();
      expect(error?.textContent).toContain('Only letters');
    });
  });

  describe('rendering', () => {
    it('should render row indices', () => {
      const el = fixture.nativeElement as HTMLElement;
      const indices = Array.from(el.querySelectorAll('.row-index')).map(e => e.textContent?.trim());
      expect(indices).toEqual(['1', '2']);
    });

    it('should render name and modifier inputs per row', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('.exp-name').length).toBe(2);
      expect(el.querySelectorAll('.exp-modifier').length).toBe(2);
    });

    it('should show complete badge when at least one experience is complete', () => {
      fillExperience(0, 'Blacksmith', '2');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.complete-badge')).toBeTruthy();
    });

    it('should not show complete badge when no experiences are complete', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.complete-badge')).toBeNull();
    });

    it('should apply complete class to row with name and modifier', () => {
      fillExperience(0, 'Blacksmith', '2');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('.experience-row');
      expect(rows[0].classList.contains('experience-row--complete')).toBe(true);
      expect(rows[1].classList.contains('experience-row--complete')).toBe(false);
    });

    it('should show add button when under max', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.add-btn')).toBeTruthy();
    });

    it('should show remove buttons when above minimum', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('.remove-btn').length).toBe(2);
    });
  });
});
