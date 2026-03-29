import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CategoryConfig, ReferenceCategory } from '../../models/reference.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';

@Component({
  selector: 'app-category-selector',
  templateUrl: './category-selector.html',
  styleUrl: './category-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe],
})
export class CategorySelector {
  readonly categories = input<CategoryConfig[]>([]);
  readonly activeCategory = input<ReferenceCategory | null>(null);
  readonly categorySelected = output<ReferenceCategory>();

  onSelectCategory(id: ReferenceCategory): void {
    this.categorySelected.emit(id);
  }
}
