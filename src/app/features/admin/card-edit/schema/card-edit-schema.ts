import { CardSchema } from './card-edit-schema.types';

export const CARD_EDIT_SCHEMAS: Record<string, CardSchema> = {
  domainCard: {
    cardType: 'domainCard',
    sections: [],
    previewTags: () => [],
  },
  ancestry: {
    cardType: 'ancestry',
    sections: [],
    previewTags: () => [],
  },
  community: {
    cardType: 'community',
    sections: [],
    previewTags: () => [],
  },
  subclass: {
    cardType: 'subclass',
    sections: [],
    previewTags: () => [],
  },
  class: {
    cardType: 'class',
    sections: [],
    previewTags: () => [],
  },
  domain: {
    cardType: 'domain',
    sections: [],
    previewTags: () => [],
  },
  subclassPath: {
    cardType: 'subclassPath',
    sections: [],
    previewTags: () => [],
  },
  weapon: {
    cardType: 'weapon',
    sections: [],
    previewTags: () => [],
  },
  armor: {
    cardType: 'armor',
    sections: [],
    previewTags: () => [],
  },
  loot: {
    cardType: 'loot',
    sections: [],
    previewTags: () => [],
  },
  companion: {
    cardType: 'companion',
    sections: [],
    previewTags: () => [],
  },
};
