// Access token is stored only in module-level memory — not in localStorage.
// This prevents XSS attacks from reading the token via `localStorage.getItem()`.
// Session is restored on page load via silent refresh (httpOnly refresh cookie).
let _accessToken: string | null = null;

export const getStoredToken = (): string | null => _accessToken;

export const setStoredToken = (token: string): void => {
  _accessToken = token;
};

export const clearStoredToken = (): void => {
  _accessToken = null;
};
