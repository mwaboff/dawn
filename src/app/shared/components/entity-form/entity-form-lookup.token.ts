import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { LookupKey, LookupOption } from './entity-form.types';

export interface EntityFormLookup {
  list(
    key: LookupKey,
    params?: { classId?: number; expansionId?: number },
  ): Observable<LookupOption[]>;
}

export const ENTITY_FORM_LOOKUP = new InjectionToken<EntityFormLookup>('ENTITY_FORM_LOOKUP');
