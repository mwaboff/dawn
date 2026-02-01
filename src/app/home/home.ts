import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  readonly features: Feature[] = [
    {
      icon: 'pen-paper',
      title: 'Create Characters',
      description: 'Build and manage your Daggerheart heroes. Track stats, abilities, and level up as you play.'
    },
    {
      icon: 'map',
      title: 'Run Campaigns',
      description: 'Organize your adventures. Invite players, manage sessions, and keep your story moving forward.'
    },
    {
      icon: 'dice',
      title: 'Play Together',
      description: 'Run your games in real-time. Roll dice, track initiative, and share the action with your party.'
    }
  ];
}
