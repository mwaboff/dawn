import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationControls } from './pagination-controls';

@Component({
  imports: [PaginationControls],
  template: `
    <app-pagination-controls
      [currentPage]="currentPage()"
      [totalPages]="totalPages()"
      (pageChanged)="onPageChanged($event)"
    />
  `,
})
class TestHost {
  currentPage = signal(0);
  totalPages = signal(0);
  lastEmittedPage: number | undefined;

  onPageChanged(page: number): void {
    this.lastEmittedPage = page;
  }
}

describe('PaginationControls', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-pagination-controls')).toBeTruthy();
  });

  it('should not be visible when totalPages is 0', () => {
    host.totalPages.set(0);
    fixture.detectChanges();
    expect(el.querySelector('.pagination')).toBeFalsy();
  });

  it('should not be visible when totalPages is 1', () => {
    host.totalPages.set(1);
    fixture.detectChanges();
    expect(el.querySelector('.pagination')).toBeFalsy();
  });

  it('should be visible when totalPages is greater than 1', () => {
    host.totalPages.set(3);
    fixture.detectChanges();
    expect(el.querySelector('.pagination')).toBeTruthy();
  });

  it('should show hasPrevious as false on first page', () => {
    host.currentPage.set(0);
    host.totalPages.set(3);
    fixture.detectChanges();
    const prevBtn = el.querySelector('.page-btn') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('should show hasPrevious as true when not on first page', () => {
    host.currentPage.set(1);
    host.totalPages.set(3);
    fixture.detectChanges();
    const prevBtn = el.querySelector('.page-btn') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(false);
  });

  it('should show hasNext as false on last page', () => {
    host.currentPage.set(2);
    host.totalPages.set(3);
    fixture.detectChanges();
    const buttons = el.querySelectorAll('.page-btn');
    const nextBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it('should show hasNext as true when not on last page', () => {
    host.currentPage.set(0);
    host.totalPages.set(3);
    fixture.detectChanges();
    const buttons = el.querySelectorAll('.page-btn');
    const nextBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);
  });

  it('should emit page - 1 when previous button is clicked', () => {
    host.currentPage.set(2);
    host.totalPages.set(5);
    fixture.detectChanges();
    const prevBtn = el.querySelector('.page-btn') as HTMLButtonElement;
    prevBtn.click();
    expect(host.lastEmittedPage).toBe(1);
  });

  it('should emit page + 1 when next button is clicked', () => {
    host.currentPage.set(1);
    host.totalPages.set(5);
    fixture.detectChanges();
    const buttons = el.querySelectorAll('.page-btn');
    const nextBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    nextBtn.click();
    expect(host.lastEmittedPage).toBe(2);
  });

  it('should disable previous button on first page', () => {
    host.currentPage.set(0);
    host.totalPages.set(3);
    fixture.detectChanges();
    const prevBtn = el.querySelector('.page-btn') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('should disable next button on last page', () => {
    host.currentPage.set(2);
    host.totalPages.set(3);
    fixture.detectChanges();
    const buttons = el.querySelectorAll('.page-btn');
    const nextBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it('should display 1-based page number', () => {
    host.currentPage.set(0);
    host.totalPages.set(5);
    fixture.detectChanges();
    const pageInfo = el.querySelector('.page-info') as HTMLElement;
    expect(pageInfo.textContent).toContain('Page 1 of 5');
  });

  it('should update display page when currentPage changes', () => {
    host.currentPage.set(3);
    host.totalPages.set(5);
    fixture.detectChanges();
    const pageInfo = el.querySelector('.page-info') as HTMLElement;
    expect(pageInfo.textContent).toContain('Page 4 of 5');
  });
});
