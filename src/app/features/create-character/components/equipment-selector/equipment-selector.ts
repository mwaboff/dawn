import { Component, input, output, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';

import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { WeaponSection } from './components/weapon-section/weapon-section';
import { ArmorSection } from './components/armor-section/armor-section';
import {
  EquipmentSubStep,
  EquipmentSelections,
  INITIAL_EQUIPMENT,
} from '../../models/equipment.model';

@Component({
  selector: 'app-equipment-selector',
  imports: [WeaponSection, ArmorSection],
  templateUrl: './equipment-selector.html',
  styleUrl: './equipment-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentSelector implements OnInit {
  readonly hasMagicAccess = input<boolean>(false);
  readonly initialSelections = input<EquipmentSelections | null>(null);

  readonly equipmentChanged = output<EquipmentSelections>();

  readonly activeSubStep = signal<EquipmentSubStep>('weapon');
  readonly selections = signal<EquipmentSelections>({ ...INITIAL_EQUIPMENT });

  ngOnInit(): void {
    const initial = this.initialSelections();
    if (initial) {
      this.selections.set(initial);
    }
  }

  onSubStepSelected(subStep: EquipmentSubStep): void {
    this.activeSubStep.set(subStep);
  }

  onWeaponSelected(selection: { primary: CardData | null; secondary: CardData | null }): void {
    this.selections.update(s => ({
      ...s,
      primaryWeapon: selection.primary,
      secondaryWeapon: selection.secondary,
    }));
    this.equipmentChanged.emit(this.selections());
  }

  onArmorSelected(armor: CardData | null): void {
    this.selections.update(s => ({ ...s, armor }));
    this.equipmentChanged.emit(this.selections());
  }

  onSkip(): void {
    if (this.activeSubStep() === 'weapon') {
      this.activeSubStep.set('armor');
    } else {
      this.equipmentChanged.emit(this.selections());
    }
  }
}
