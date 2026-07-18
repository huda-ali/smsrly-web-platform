let listeners = [];
let idCounter = 0;

function emit(message, type) {
  const toast = { id: ++idCounter, message, type };
  listeners.forEach((listener) => listener(toast));
}

export const toastBus = {
  error: (message) => emit(message, "error"),
  success: (message) => emit(message, "success"),
  info: (message) => emit(message, "default"),
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
