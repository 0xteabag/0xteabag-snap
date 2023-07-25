import { IAuthData } from './types';

type SnapStorage<T extends Record<string, any>> = {
  get: <N extends keyof T>(key: N) => Promise<T[N] | undefined>;
  set: <N extends keyof T>(key: N, value: T[N]) => Promise<void>;
  clear: <N extends keyof T>(key: N) => Promise<void>;
  clearAll: () => Promise<void>;
};

interface StorageItems {
  auth: IAuthData;
}

export const storage: SnapStorage<StorageItems> = {
  get,
  set,
  clear,
  clearAll,
};

async function get(key: string): Promise<any> {
  const state = await getAll();

  if (!state) return;

  // eslint-disable-next-line consistent-return
  return state[key];
}

async function set(key: string, value: any): Promise<void> {
  const state = (await getAll()) || {};

  state[key] = value;

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
}

async function clear(key: string): Promise<void> {
  await set(key, undefined);
}

async function clearAll(): Promise<void> {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'clear' },
  });
}

async function getAll() {
  const persistedData = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return persistedData;
}
