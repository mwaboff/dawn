import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-equipment-pagination',
  templateUrl: './equipment-pagination.html',
  styleUrl: './equipment-pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentPagination {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalElements = input.required<number>();

  readonly pageChanged = output<number>();

  readonly isFirstPage = computed(() => this.currentPage() === 0);
  readonly isLastPage = computed(() => this.currentPage() >= this.totalPages() - 1);

  readonly displayPages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i);

    let start = Math.max(0, current - 2);
    const end = Math.min(total - 1, start + 4);
    start = Math.max(0, end - 4);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  onPrevious(): void {
    if (!this.isFirstPage()) this.pageChanged.emit(this.currentPage() - 1);
  }

  onNext(): void {
    if (!this.isLastPage()) this.pageChanged.emit(this.currentPage() + 1);
  }

  onPageClick(page: number): void {
    if (page !== this.currentPage()) this.pageChanged.emit(page);
  }
}
