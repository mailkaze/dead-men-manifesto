import es from './es';

// Textos por idioma. De momento solo español; para añadir inglés, crear en.ts con las mismas claves.
export type TextKey = keyof typeof es;

export function t(key: TextKey): string {
  return es[key];
}
