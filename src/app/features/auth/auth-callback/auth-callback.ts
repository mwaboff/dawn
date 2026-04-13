import { Component, ChangeDetectionStrategy, inject, afterNextRender } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  template: `<p class="callback-message">Completing sign-in...</p>`,
  styles: `.callback-message { text-align: center; padding: 2rem; color: #f5e6d3; font-family: 'Lora', serif; }`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallback {
  private readonly router = inject(Router);

  constructor() {
    afterNextRender(() => {
      const params = new URLSearchParams(window.location.search);
      const data = {
        type: 'oauth-callback',
        params: {
          needsUsername: params.get('needsUsername'),
          error: params.get('error')
        }
      };

      if (window.opener) {
        window.opener.postMessage(data, window.location.origin);
        window.close();
      } else {
        if (data.params.error) {
          this.router.navigate(['/auth'], { queryParams: { error: data.params.error } });
        } else if (data.params.needsUsername === 'true') {
          this.router.navigate(['/choose-username']);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
  }
}
