export function gql(strings: any) {
  const str = strings[0];
  const parsed = str.replace(/ +/g, ' ').trim();
  return parsed;
}
