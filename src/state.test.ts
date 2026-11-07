import { describe, expect, it } from 'vitest';
import { stateFromQuery, type GameState } from './state';

const PRESETS: Record<string, GameState> = {
  'new-game': { scene: 'room', flags: {} },
  street: { scene: 'street', x: 34, y: 146, dir: 'right', flags: { introSeen: true } },
};

describe('stateFromQuery', () => {
  it('sin parámetros arranca la partida nueva', () => {
    expect(stateFromQuery('', PRESETS)).toEqual({ state: { scene: 'room', flags: {} }, warnings: [] });
  });

  it('carga un estado con nombre', () => {
    expect(stateFromQuery('?state=street', PRESETS).state).toEqual(PRESETS.street);
  });

  it('un estado desconocido avisa y vuelve a la partida nueva', () => {
    const { state, warnings } = stateFromQuery('?state=nope', PRESETS);
    expect(state).toEqual(PRESETS['new-game']);
    expect(warnings).toEqual(['Estado desconocido: "nope". Se usa "new-game".']);
  });

  it('x, y y dir sustituyen a los del estado', () => {
    const { state, warnings } = stateFromQuery('?state=street&x=441&y=132&dir=up', PRESETS);
    expect(state).toEqual({ scene: 'street', x: 441, y: 132, dir: 'up', flags: { introSeen: true } });
    expect(warnings).toEqual([]);
  });

  it('cambiar de escena descarta la posición del estado base', () => {
    const { state } = stateFromQuery('?state=street&scene=field', PRESETS);
    expect(state).toEqual({ scene: 'field', flags: { introSeen: true } });
  });

  it('valores no válidos avisan y se ignoran', () => {
    const { state, warnings } = stateFromQuery('?state=street&scene=moon&x=abc&y=&dir=north', PRESETS);
    expect(state).toEqual(PRESETS.street);
    expect(warnings).toEqual([
      'Escena desconocida: "moon".',
      'Valor no numérico para x: "abc".',
      'Valor no numérico para y: "".',
      'Dirección desconocida: "north".',
    ]);
  });

  it('flags se suman a los del estado con su tipo', () => {
    const { state } = stateFromQuery('?state=street&flags=introSeen=false,crates=3,era=1999b,met', PRESETS);
    expect(state.flags).toEqual({ introSeen: false, crates: 3, era: '1999b', met: true });
  });

  it('items se suman a los del estado sin repetirse', () => {
    const presets: Record<string, GameState> = { ...PRESETS, lab: { scene: 'street', flags: {}, items: ['idCard'] } };
    expect(stateFromQuery('?state=lab&items=map,idCard', presets).state.items).toEqual(['idCard', 'map']);
    expect(stateFromQuery('?items=idCard', presets).state.items).toEqual(['idCard']);
    expect(stateFromQuery('?state=lab', presets).state.items).toEqual(['idCard']);
    expect(presets.lab.items).toEqual(['idCard']);
  });

  it('no modifica los estados originales', () => {
    stateFromQuery('?state=street&x=1&flags=met', PRESETS);
    expect(PRESETS.street).toEqual({ scene: 'street', x: 34, y: 146, dir: 'right', flags: { introSeen: true } });
  });
});
