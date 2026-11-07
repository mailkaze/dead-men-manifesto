import type { TextKey } from './i18n';

// Catálogo de objetos: nombre y mensaje al conseguirlo (claves de src/i18n).
export const ITEMS = {
  idCard: { name: 'item.idCard.name', obtained: 'item.idCard.obtained' },
} satisfies Record<string, { name: TextKey; obtained: TextKey }>;

export type ItemId = keyof typeof ITEMS;

export const isItemId = (id: string): id is ItemId => Object.hasOwn(ITEMS, id);
