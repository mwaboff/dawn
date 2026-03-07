import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { EquipmentPagination } from './equipment-pagination';

@Component({
  template: `<app-equipment-pagination
    [currentPage]="currentPage()"
    [totalPages]="totalPages()"
    [totalElements]="totalElements()"
    (pageChanged)="onPageChanged($event)"
  />`,
  imports: [EquipmentPagination],
})
class TestHost {
  currentPage = signal(0);
  totalPages = signal(5);
  totalElements = signal(50);
  lastPageChanged: number | undefined;
  onPageChanged(page: number) {
    this.lastPageChanged = page;
  }
}

describe('EquipmentPagination', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  function setup(overrides?: { currentPage?: number; totalPages?: number; totalElements?: number }) {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    if (overrides?.currentPage !== undefined) host.currentPage.set(overrides.currentPage);
    if (overrides?.totalPages !== undefined) host.totalPages.set(overrides.totalPages);
    if (overrides?.totalElements !== undefined) host.totalElements.set(overrides.totalElements);
    fixture.detectChanges();
  }

  it('should create the component', () => {
    setup();
    const pagination = fixture.nativeElement.querySelector('app-equipment-pagination');
    expect(pagination).toBeTruthy();
  });

  it('should not render when totalPages is 1', () => {
    setup({ totalPages: 1 });
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
  });

  it('should not render when totalPages is 0', () => {
    setup({ totalPages: 0 });
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
  });

  it('should render when totalPages is greater than 1', () => {
    setup({ totalPages: 3 });
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('should disable previous button on first page', () => {
    setup({ currentPage: 0, totalPages: 5 });
    const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous page"]');
    expect(prevBtn.disabled).toBe(true);
  });

  it('should disable next button on last page', () => {
    setup({ currentPage: 4, totalPages: 5 });
    const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next page"]');
    expect(nextBtn.disabled).toBe(true);
  });

  it('should enable both buttons on a middle page', () => {
    setup({ currentPage: 2, totalPages: 5 });
    const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous page"]');
    const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next page"]');
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);
  });

  it('should emit pageChanged with page number when clicking a page button', () => {
    setup({ currentPage: 0, totalPages: 5 });
    const page3Btn = fixture.nativeElement.querySelector('[aria-label="Page 3"]');
    page3Btn.click();
    expect(host.lastPageChanged).toBe(2);
  });

  it('should not emit pageChanged when clicking the current page', () => {
    setup({ currentPage: 2, totalPages: 5 });
    host.lastPageChanged = undefined;
    const currentBtn = fixture.nativeElement.querySelector('[aria-current="page"]');
    currentBtn.click();
    expect(host.lastPageChanged).toBeUndefined();
  });

  it('should emit currentPage - 1 when clicking previous', () => {
    setup({ currentPage: 3, totalPages: 5 });
    const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous page"]');
    prevBtn.click();
    expect(host.lastPageChanged).toBe(2);
  });

  it('should emit currentPage + 1 when clicking next', () => {
    setup({ currentPage: 1, totalPages: 5 });
    const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next page"]');
    nextBtn.click();
    expect(host.lastPageChanged).toBe(2);
  });

  it('should show all pages when totalPages <= 5', () => {
    setup({ currentPage: 0, totalPages: 3, totalElements: 30 });
    const pageButtons = fixture.nativeElement.querySelectorAll('.pagination__btn:not([aria-label="Previous page"]):not([aria-label="Next page"])');
    expect(pageButtons.length).toBe(3);
    expect(pageButtons[0].textContent.trim()).toBe('1');
    expect(pageButtons[1].textContent.trim()).toBe('2');
    expect(pageButtons[2].textContent.trim()).toBe('3');
  });

  it('should show a window of 5 pages when totalPages > 5', () => {
    setup({ currentPage: 5, totalPages: 10, totalElements: 100 });
    const pageButtons = fixture.nativeElement.querySelectorAll('.pagination__btn:not([aria-label="Previous page"]):not([aria-label="Next page"])');
    expect(pageButtons.length).toBe(5);
  });

  it('should apply active class to the current page button', () => {
    setup({ currentPage: 2, totalPages: 5 });
    const activeBtn = fixture.nativeElement.querySelector('.pagination__btn--active');
    expect(activeBtn).toBeTruthy();
    expect(activeBtn.textContent.trim()).toBe('3');
  });

  it('should set aria-current on the active page button', () => {
    setup({ currentPage: 1, totalPages: 5 });
    const currentBtn = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(currentBtn).toBeTruthy();
    expect(currentBtn.textContent.trim()).toBe('2');
  });
});
