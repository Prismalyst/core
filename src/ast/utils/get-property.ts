import type { ParsedValue } from '../../types/ast.types.js';

/**
 * Looks up a nested parsed value while hiding the intermediate `.value` wrappers.
 *
 * Each path segment reads an own property from the current wrapper's `value`.
 * Object keys can be strings or numbers; numbers follow JavaScript's object-key
 * coercion. String keys are literal: `['user.name']` differs from `['user', 'name']`.
 * Arrays require non-negative integer indexes supplied as numbers:
 * `0` is valid, while `'0'`, `'length'`, negative numbers and fractions are not.
 * Inherited properties and missing or sparse array elements are not followed.
 *
 * An empty path returns `argument` itself. A missing argument, missing property,
 * invalid array index, or intermediate value without a wrapped child returns
 * `undefined`. A present field whose value is explicitly `undefined` still
 * returns its `{ value: undefined, node }` wrapper.
 *
 * The result is the existing wrapper, including its original source node; no
 * values are cloned, unwrapped recursively, inferred, or mutated. Object and
 * array results still contain wrapped children. Source locations are chosen by
 * the parser and may point to a declaration elsewhere. Numeric paths through
 * an inferred array type cannot select actual elements without a parsed array.
 *
 * @param argument The parsed root argument, or `undefined` when it is absent.
 * @param path Object keys and array indexes relative to that argument.
 * @returns The final `{ value, node }` wrapper, or `undefined` if lookup fails.
 *
 * @example
 * getProperty(expression.args[0], ['take'])?.value;
 * getProperty(expression.args[0], ['where', 'email'])?.node;
 * getProperty(expression.args[0], ['where', 'OR', 0, 'email']);
 * getProperty(expression.args[0], []); // The original argument wrapper.
 */
export function getProperty(
  argument: ParsedValue | undefined,
  path: readonly (string | number)[],
): ParsedValue | undefined {
  let current = argument;

  for (const segment of path) {
    const value = current?.value;

    if (Array.isArray(value)) {
      if (
        typeof segment !== 'number' ||
        !Number.isInteger(segment) ||
        segment < 0 ||
        segment >= value.length
      ) {
        return undefined;
      }

      current = Object.hasOwn(value, segment) ? value[segment] : undefined;
      continue;
    }

    if (typeof value !== 'object' || value === null) return undefined;

    if (!Object.hasOwn(value, segment)) return undefined;

    const property = (value as Record<string | number, unknown>)[segment];

    if (
      typeof property !== 'object' ||
      property === null ||
      !Object.hasOwn(property, 'value') ||
      !Object.hasOwn(property, 'node')
    ) {
      return undefined;
    }

    current = property as ParsedValue;
  }

  return current;
}
