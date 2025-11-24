// Centraliza la lógica de interacción por teclado para overlays y diálogos modales.
// Evita duplicar complejidad en cada página y mantiene un único comportamiento accesible.

const DEFAULT_ACTIVATION_KEYS = ['Enter', ' ', 'Spacebar'];

const isActivationKey = (key, activationKeys = DEFAULT_ACTIVATION_KEYS) => (
  activationKeys.includes(key)
);

const shouldHandleOverlayActivation = (event, activationKeys) => (
  event.target === event.currentTarget && isActivationKey(event.key, activationKeys)
);

export const createOverlayKeyboardHandlers = (closeFn, options = {}) => {
  const activationKeys = options.activationKeys || DEFAULT_ACTIVATION_KEYS;

  const onOverlayKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeFn?.();
      return;
    }
    if (shouldHandleOverlayActivation(event, activationKeys)) {
      event.preventDefault();
    }
  };

  const onOverlayKeyUp = (event) => {
    if (shouldHandleOverlayActivation(event, activationKeys)) {
      event.preventDefault();
      closeFn?.();
    }
  };

  return { onOverlayKeyDown, onOverlayKeyUp };
};

export const createDialogKeyboardHandlers = (closeFn) => {
  const onDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeFn?.();
    }
    event.stopPropagation();
  };

  const onDialogKeyUp = (event) => {
    event.stopPropagation();
  };

  return { onDialogKeyDown, onDialogKeyUp };
};

export const createOverlayClickHandler = (closeFn) => (event) => {
  if (event.target === event.currentTarget) {
    event.preventDefault?.();
    closeFn?.();
  }
};
