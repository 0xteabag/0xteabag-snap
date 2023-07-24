import { API_URL } from './env';
import { IAuthData, GraphQLErrorCode } from './types';
import { makeLogger } from './logger';
import { MINUTE_MILLIS } from './constants';
import { storage } from './storage';
import { gql } from './gql';

interface IQueryParams {
  operationName: string;
  query: string;
  variables?: any;
}

interface IMutationParams {
  operationName: string;
  mutation: string;
  variables?: any;
}

const logger = makeLogger('[apiClient]');

const authTokenRefreshTreshold = 10 * MINUTE_MILLIS;

export const apiClient = {
  query,
  mutate,
};

async function query(params: IQueryParams) {
  const authorization = await getAuthHeader();
  const res = await post(params, {
    authorization,
  });
  return handleApolloResponse(res);
}

async function mutate(params: IMutationParams) {
  const authorization = await getAuthHeader();
  const queryParams: IQueryParams = {
    operationName: params.operationName,
    query: params.mutation,
    variables: params.variables,
  };
  const res = await post(queryParams, {
    authorization,
  });
  return handleApolloResponse(res);
}

async function getAuthHeader() {
  const authData = await getValidAuthData();
  const authToken = authData?.token;
  const authHeader = authToken ? `Bearer ${authToken}` : '';
  return authHeader;
}

export async function getValidAuthData(): Promise<IAuthData> {
  const authData = await storage.get('auth');
  logger.log('Current authData', authData);
  let validAuthData = authData;
  if (authData?.expires) {
    const expirationTime = new Date(authData.expires).getTime();
    const thresholdTime = new Date().getTime() + authTokenRefreshTreshold;
    const shouldRefresh = expirationTime < thresholdTime;
    if (shouldRefresh) {
      logger.log('Refreshing auth token', authData);
      validAuthData = await refreshAuth(authData.refreshToken);
    } else {
      logger.log('Auth token valid', {
        authData,
        shouldRefresh,
        expirationTime,
        thresholdTime,
      });
    }
  }

  return validAuthData!;
}

export async function refreshAuth(refreshToken: string): Promise<IAuthData> {
  const { data } = await post({
    operationName: 'RefreshAuth',
    query: gql`
      mutation RefreshAuth($refreshToken: String!) {
        refreshAuth(refreshToken: $refreshToken) {
          id
          email
          token
          refreshToken
          expires
        }
      }
    `,
    variables: {
      refreshToken,
    },
  });

  const authData = data.refreshAuth;
  await storage.set('auth', authData);

  return authData;
}

async function post(body: any, headers?: any) {
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  });

  return handleResponse(res);
}

async function handleResponse(res: Response) {
  const normalized = await normalizeResponse(res);
  return handleNormalizedResponse(normalized);
}

async function normalizeResponse(res: Response) {
  try {
    if (res.ok) {
      const json = await res.json();
      return handleApolloResponse(json);
    }
    throw new Error(`${res.status} - ${res.statusText}`);
  } catch (e) {
    console.log('Fetch error', e);
    return {
      error: e as any,
    } as any;
  }
}

async function handleApolloResponse(res: any): Promise<any> {
  try {
    if (res.error && !res.errors) {
      res.errors = [res.error];
    }

    if (res.errors && res.errors.length > 0 && !res.error) {
      res.error = res.errors[0];
    }
    return res;
  } catch (e) {
    console.log('Apollo error', e);
    return {
      error: e as any,
      errors: [e as any],
    } as any;
  }
}

async function handleNormalizedResponse(res: any): Promise<any> {
  const errors = res.errors || Boolean(res.error) ? [res.error] : [];
  const hasErrors = errors.length > 0;
  const hasAuthError = errors.some(
    (e) => (e?.extensions?.code as GraphQLErrorCode) === 'UNAUTHENTICATED'
  );

  if (hasAuthError) {
    logger.log('Auth error, logging out');
    await storage.clearAll();
  }

  if (hasErrors) {
    logger.error('Apollo errors', errors);
    const message =
      errors[0].message || errors[0].toString() || 'Unknown error';
    throw new Error(message);
  }

  return res;
}
