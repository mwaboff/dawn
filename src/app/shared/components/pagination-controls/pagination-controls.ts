import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination-controls',
  templateUrl: './pagination-controls.html',
  styleUrl: './pagination-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationControls {
  readonly currentPage = input<number>(0);
  readonly totalPages = input<number>(0);

  readonly pageChanged = output<number>();

  readonly hasPrevious = computed(() => this.currentPage() > 0);
  readonly hasNext = computed(() => this.currentPage() < this.totalPages() - 1);
  readonly displayPage = computed(() => this.currentPage() + 1);
  readonly isVisible = computed(() => this.totalPages() > 1);

  onPrevious(): void {
    this.pageChanged.emit(this.currentPage() - 1);
  }

  onNext(): void {
    this.pageChanged.emit(this.currentPage() + 1);
  }

  onGoToPage(page: number): void {
    this.pageChanged.emit(page);
  }
}
