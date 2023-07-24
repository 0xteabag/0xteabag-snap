export const NODE_ENV: 'development' | 'staging' | 'production' = env(
  process.env.NODE_ENV!,
  'string'
) as any;
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const API_URL = env(process.env.API_URL!, 'string');
export const SNAP_HOME = env(process.env.SNAP_HOME!, 'string');

///////////////////////////////////////////////////////////////////////

type EnvReturnTypeStr = 'string' | 'number' | 'boolean';
type EnvReturnType = string | number | boolean;

function env(envVar: string, type: 'string', defaultVal?: string): string;
function env(envVar: string, type: 'number', defaultVal?: number): number;
function env(envVar: string, type: 'boolean', defaultVal?: boolean): boolean;
function env(
  envVar: string,
  type: EnvReturnTypeStr,
  defaultVal?: EnvReturnType
): EnvReturnType {
  let val: EnvReturnType = envVar as any;
  val = validateRequiredOrApplyDefault(envVar, val, defaultVal as any);
  return convertType(envVar, val, type);
}

function validateRequiredOrApplyDefault(
  key: string,
  val: EnvReturnType,
  defaultVal: EnvReturnType
): EnvReturnType {
  if (defaultVal === undefined && !val) {
    throw new Error(`Missing required env var ${key}`);
  }

  return val || defaultVal;
}

function convertType(
  key: string,
  val: EnvReturnType,
  type: EnvReturnTypeStr
): EnvReturnType {
  switch (type) {
    case 'number': {
      return convertToNumber(key, val);
    }
    case 'boolean': {
      return convertToBoolean(key, val);
    }
    default: {
      return val;
    }
  }
}

function convertToNumber(key: string, val: EnvReturnType): number {
  const num = Number(val);

  if (isNaN(num)) {
    throw new Error(`Env var ${key} is not a number`);
  }

  return num;
}

function convertToBoolean(key: string, val: EnvReturnType): boolean {
  const valLower = ('' + val).toLowerCase();
  const truthyVals = ['true', '1'];
  const falsyVals = ['false', '0'];
  const acceptedVals = [...truthyVals, ...falsyVals];

  if (!acceptedVals.includes(valLower)) {
    throw new Error(`Env var ${key} is not a boolean`);
  }

  return truthyVals.includes(valLower);
}
