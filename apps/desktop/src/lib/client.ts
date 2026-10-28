import { createApi } from './api';
import { serverUrl } from './config';
import { useSession } from '../state/session';

/** Shared API client. A 401 on an authenticated call signs the user out (see features/auth/auth.ts). */
let unauthorizedHandler: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  unauthorizedHandler = fn;
};

export const api = createApi({
  baseUrl: serverUrl,
  getToken: () => useSession.getState().token,
  onUnauthorized: () => unauthorizedHandler(),
});
