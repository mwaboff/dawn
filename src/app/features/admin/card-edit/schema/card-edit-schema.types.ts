export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'url'
  | 'enum'
  | 'entity'
  | 'entityMulti';

export interface BaseField {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  maxLength?: number;
  min?: number;
  positive?: boolean;
  helpText?: string;
  column?: 1 | 2 | 'full';
}

export interface EnumField extends BaseField {
  kind: 'enum';
  options: { value: string; label: string }[];
}

export type LookupKey =
  | 'expansions'
  | 'domains'
  | 'classes'
  | 'subclassPaths'
  | 'domainFeatures'
  | 'ancestryFeatures'
  | 'classFeatures'
  | 'hopeFeatures'
  | 'communityFeatures'
  | 'subclassFeatures'
  | 'costTags';

export interface EntityField extends BaseField {
  kind: 'entity' | 'entityMulti';
  lookup: LookupKey;
  dependsOn?: string;
  allowCreate?: boolean;
}

export type FieldDef = BaseField | EnumField | EntityField;

export interface LookupOption {
  id: number;
  label: string;
}

export interface CardSchema {
  cardType: string;
  sections: { title: string; fields: FieldDef[] }[];
  previewTags: (value: Record<string, unknown>) => string[];
  previewSubtitle?: (value: Record<string, unknown>) => string | undefined;
}
