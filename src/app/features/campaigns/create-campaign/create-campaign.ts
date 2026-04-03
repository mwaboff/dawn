import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CampaignService } from '../../../shared/services/campaign.service';

@Component({
  selector: 'app-create-campaign',
  templateUrl: './create-campaign.html',
  styleUrl: './create-campaign.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class CreateCampaign {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly campaignService = inject(CampaignService);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const { name, description } = this.form.getRawValue();
    this.campaignService
      .createCampaign({ name, description: description || undefined })
      .subscribe({
        next: campaign => {
          this.router.navigate(['/campaign', campaign.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.errorMessage.set(
            err.status === 400
              ? 'Please check your input and try again.'
              : 'Something went wrong. Please try again.',
          );
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/campaigns']);
  }
}
