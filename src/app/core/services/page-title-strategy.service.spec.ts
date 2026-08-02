import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { PageTitleStrategy } from './page-title-strategy.service';

describe('PageTitleStrategy', () => {
  let strategy: PageTitleStrategy;
  let titleService: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PageTitleStrategy] });
    strategy = TestBed.inject(PageTitleStrategy);
    titleService = TestBed.inject(Title);
  });

  it('appends the site name to a route-provided title', () => {
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Character Sheet');
    strategy.updateTitle({} as RouterStateSnapshot);
    expect(titleService.getTitle()).toBe('Character Sheet · Oh Sheet');
  });

  it('falls back to the bare site name when no route sets a title', () => {
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    strategy.updateTitle({} as RouterStateSnapshot);
    expect(titleService.getTitle()).toBe('Oh Sheet');
  });
});
