const AUTH_TOKEN_KEY = 'headache-hub.access-token';

export const getStoredToken = (): string | null => {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};
