import { atom } from 'nanostores';

// Helper para leer del localStorage (sólo en cliente)
const getInitialState = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cord_test_mode') === 'true';
  }
  return false;
};

// Atom principal
export const $isTestMode = atom<boolean>(getInitialState());

// Suscribirse a cambios para persistir en localStorage
if (typeof window !== 'undefined') {
  $isTestMode.listen((value) => {
    localStorage.setItem('cord_test_mode', String(value));
    // Disparar evento para que vanilla JS (ej. api.astro) pueda reaccionar
    window.dispatchEvent(new CustomEvent('cord:test_mode_changed', { detail: { isTestMode: value } }));
  });
}
