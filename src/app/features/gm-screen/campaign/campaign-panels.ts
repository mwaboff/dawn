import { GmPanelDef } from '../models/gm-panel.model';
import { FearCounterPanel } from './panels/fear-counter-panel/fear-counter-panel';
import { SheetViewerPanel } from './panels/sheet-viewer-panel/sheet-viewer-panel';
import { GmNotesPanel } from './panels/gm-notes-panel/gm-notes-panel';
import { EncounterBuilderPanel } from './panels/encounter-builder-panel/encounter-builder-panel';

/**
 * Live campaign tools, prepended to the static rules reference on the campaign GM screen.
 * Negative `defaultOrder` values sort them above every reference panel on first load.
 */
export const CAMPAIGN_GM_PANELS: readonly GmPanelDef[] = [
  {
    id: 'fear-counter',
    title: 'Fear',
    colSpan: 1,
    defaultOrder: -400,
    body: { kind: 'component', component: FearCounterPanel },
    keywords: ['fear', 'pool', 'tracker', 'counter'],
  },
  {
    id: 'sheet-viewer',
    title: 'Character Sheets',
    colSpan: 2,
    defaultOrder: -300,
    body: { kind: 'component', component: SheetViewerPanel },
    keywords: ['character', 'sheet', 'pc', 'npc', 'stat block', 'party'],
  },
  {
    id: 'gm-notes',
    title: 'Session Notes',
    colSpan: 2,
    defaultOrder: -200,
    body: { kind: 'component', component: GmNotesPanel },
    keywords: ['notes', 'session', 'prep', 'secrets'],
  },
  {
    id: 'encounter-builder',
    title: 'Encounter Builder',
    colSpan: 1,
    defaultOrder: -100,
    body: { kind: 'component', component: EncounterBuilderPanel },
    keywords: ['encounter', 'battle points', 'adversaries'],
  },
];
