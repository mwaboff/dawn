import { Pipe, PipeTransform } from '@angular/core';
import { escapeAndFormatHtml } from '../utils/text.utils';

@Pipe({ name: 'formatText' })
export class FormatTextPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return escapeAndFormatHtml(value);
  }
}
