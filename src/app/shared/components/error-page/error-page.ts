import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ErrorContent {
  code: string;
  title: string;
  message: string;
}

const ERROR_CONTENT: Record<number, ErrorContent> = {
  403: {
    code: '403',
    title: 'The Door is Locked',
    message: 'You do not have permission to enter here.',
  },
  404: {
    code: '404',
    title: 'Lost in the Fog',
    message: 'This page does not exist, or has drifted off the map.',
  },
};

const DEFAULT_CONTENT: ErrorContent = {
  code: '',
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred. Please try again later.',
};

@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  templateUrl: './error-page.html',
  styleUrl: './error-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage {
  readonly status = input(404);

  readonly content = computed<ErrorContent>(() => ERROR_CONTENT[this.status()] ?? DEFAULT_CONTENT);
}
