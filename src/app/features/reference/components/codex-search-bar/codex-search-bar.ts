import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-codex-search-bar',
  templateUrl: './codex-search-bar.html',
  styleUrl: './codex-search-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class CodexSearchBar implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly query = input('');
  readonly activeChips = input<FilterChip[]>([]);
  readonly placeholder = input('Search the archives…');

  readonly queryChange = output<string>();
  readonly chipRemove = output<FilterChip>();

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  readonly hasChips = computed(() => this.activeChips().length > 0);

  private readonly inputSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  private readonly internalQuery = signal('');

  constructor() {
    this.inputSubject
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.queryChange.emit(q));

    effect(() => {
      this.internalQuery.set(this.query());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.internalQuery.set(value);
    this.inputSubject.next(value);
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const isCmdOrCtrlK = (event.metaKey || event.ctrlKey) && event.key === 'k';
    if (isCmdOrCtrlK) {
      event.preventDefault();
      this.searchInputRef?.nativeElement.focus();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.internalQuery.set('');
      this.inputSubject.next('');
      this.queryChange.emit('');
    }
  }

  onChipRemove(chip: FilterChip): void {
    this.chipRemove.emit(chip);
  }

  getInternalQuery(): string {
    return this.internalQuery();
  }
}
