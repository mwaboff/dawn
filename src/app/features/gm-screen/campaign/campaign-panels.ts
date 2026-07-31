import { GmPanelDef } from '../models/gm-panel.model';
import { SheetViewerPanel } from './panels/sheet-viewer-panel/sheet-viewer-panel';
import { GmNotesPanel } from './panels/gm-notes-panel/gm-notes-panel';
import { EncounterBuilderPanel } from './panels/encounter-builder-panel/encounter-builder-panel';

/**
 * Live campaign tools, prepended to the static rules reference on the campaign GM screen.
 * Negative `defaultOrder` values sort them above every reference panel on first load.
 *
 * Fear is deliberately absent: it changes several times per scene, so the campaign page pins it
 * into the board's sticky lead slot instead of letting it scroll away with the reference panels.
 */
export const CAMPAIGN_GM_PANELS: readonly GmPanelDef[] = [
  {
    id: 'sheet-viewer',
    title: 'The Party',
    category: 'This Campaign',
    colSpan: 3,
    defaultOrder: -300,
    body: { kind: 'component', component: SheetViewerPanel },
    keywords: ['character', 'sheet', 'pc', 'npc', 'stat block', 'party', 'roster', 'evasion'],
  },
  {
    id: 'gm-notes',
    title: 'Session Notes',
    category: 'This Campaign',
    colSpan: 2,
    defaultOrder: -200,
    body: { kind: 'component', component: GmNotesPanel },
    keywords: ['notes', 'session', 'prep', 'secrets'],
  },
  {
    id: 'encounter-builder',
    title: 'Encounter Builder',
    category: 'This Campaign',
    colSpan: 1,
    defaultOrder: -100,
    defaultCollapsed: true,
    body: { kind: 'component', component: EncounterBuilderPanel },
    keywords: ['encounter', 'battle points', 'adversaries'],
  },
];
