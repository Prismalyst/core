import { expect } from 'vitest';

import type { AstValue, ParsedValue } from '../../types/ast.types.js';

/** Adapts the existing value-based fixtures and expectations to wrapped arguments. */
export function wrapArguments(values: readonly unknown[]): ParsedValue[] {
  return values.map(wrapValue);
}

function wrapValue(value: unknown): ParsedValue {
  let wrapped: unknown = value;

  if (Array.isArray(value)) {
    wrapped = value.map(wrapValue);
  } else if (typeof value === 'object' && value !== null) {
    const object = value as Record<string, unknown>;
    const isNode = typeof object.kind === 'number' && typeof object.getSourceFile === 'function';

    if (object.kind === 'template' && Array.isArray(object.templateSpans)) {
      wrapped = {
        ...object,
        templateSpans: object.templateSpans.map((span) => ({
          ...span,
          value: wrapValue(span.value),
        })),
      };
    } else if (object.kind === 'union' && Array.isArray(object.types)) {
      wrapped = { ...object, types: object.types.map(wrapValue) };
    } else if (object.kind === 'array') {
      wrapped = { ...object, element: wrapValue(object.element) };
    } else if (!isNode && object.kind !== 'type' && object.kind !== 'template') {
      wrapped = Object.fromEntries(
        Object.entries(object).map(([key, field]) => [key, wrapValue(field)]),
      );
    }
  }

  // Existing tests check parsed values and rule behavior, not source locations.
  return { value: wrapped as AstValue, node: expect.anything() };
}
