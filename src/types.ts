export interface IAuthData {
  id: number;
  email: string;
  token: string;
  refreshToken: string;
  expires: string;
}

export type GraphQLErrorCode =
  | 'UNAUTHENTICATED'
  | 'TOO_MANY_REQUESTS'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_USER_INPUT';
