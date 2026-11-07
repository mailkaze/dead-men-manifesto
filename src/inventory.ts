import { world } from './core';
import { say } from './dialogue';
import { t } from './i18n';
import { ITEMS, type ItemId } from './items';

// Inventario de Jessica (world.items) y la mochila: un panel sobre la pantalla que pausa el juego.
export function hasItem(id: ItemId) { return world.items.includes(id); }

// Añade el objeto (una sola vez) y lo anuncia.
export function giveItem(id: ItemId) {
  if (hasItem(id)) return;
  world.items.push(id);
  say([t(ITEMS[id].obtained)]);
}

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const panel = $('inv'), list = $('invList');
$('invTitle').textContent = t('inventory.title');
$('lblInv').textContent = t('inventory.title');

function item(text: string, cls?: string) {
  const li = document.createElement('li');
  li.textContent = text;
  if (cls) li.className = cls;
  return li;
}

export function isInventoryOpen() { return !panel.hidden; }

export function toggleInventory(open = panel.hidden) {
  if (open) {
    list.replaceChildren(...(world.items.length
      ? world.items.map(id => item(t(ITEMS[id].name)))
      : [item(t('inventory.empty'), 'empty')]));
  }
  panel.hidden = !open;
}

$('invClose').addEventListener('click', () => toggleInventory(false));
// Tocar fuera del recuadro también cierra.
panel.addEventListener('click', e => { if (e.target === panel) toggleInventory(false); });
addEventListener('keydown', e => { if (e.code === 'Escape') toggleInventory(false); });
