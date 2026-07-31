import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GmScreen } from './gm-screen';
import { GmPanelGrid } from './components/gm-panel-grid/gm-panel-grid';
import { STATIC_GM_PANELS } from './content/panel-registry';

describe('GmScreen', () => {
  let fixture: ComponentFixture<GmScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GmScreen],
    }).compileComponents();

    fixture = TestBed.createComponent(GmScreen);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the page heading', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('GM Screen');
  });

  it('should pass the full static panel set to the panel grid', () => {
    fixture.detectChanges();
    const grid = fixture.debugElement.query(el => el.componentInstance instanceof GmPanelGrid);
    expect(grid).toBeTruthy();
    expect(grid.componentInstance.panels()).toEqual(STATIC_GM_PANELS);
  });

  it('should offer the floating dice roller', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dice-roller')).toBeTruthy();
  });

  it('should use a stable storage key for the panel grid', () => {
    fixture.detectChanges();
    const grid = fixture.debugElement.query(el => el.componentInstance instanceof GmPanelGrid);
    expect(grid.componentInstance.storageKey()).toBe('gm-screen');
  });
});
