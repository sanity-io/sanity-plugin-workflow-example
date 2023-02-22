export function arraysContainMatchingString(
  one: string[],
  two: string[]
): boolean {
  return one.some((item) => two.includes(item))
}
