import { OnRpcRequestHandler } from '@metamask/snaps-types';

import { storage } from './storage';

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'getAuth': {
      const auth = await storage.get('auth');
      return auth;
    }

    case 'setAuth': {
      await storage.set('auth', request.params as any);
      // eslint-disable-next-line consistent-return
      return;
    }

    default: {
      throw new Error('Method not found.');
    }
  }
};
