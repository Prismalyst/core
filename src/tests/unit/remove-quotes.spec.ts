import { describe, expect, it } from 'vitest';

import { removeQuotes } from '../../ast/prisma/utils/remove-quotes.js';

describe('removeQuotes', () => {
  it.each(['"', "'", '`'])('removes matching %s quotes', (quote) => {
    expect(removeQuotes(`${quote}findMany${quote}`)).toBe('findMany');
  });

  it.each(['"', "'", '`'])('returns an empty string for an empty %s-quoted value', (quote) => {
    expect(removeQuotes(`${quote}${quote}`)).toBe('');
  });

  it.each(['"', "'", '`'])('returns an empty string for a single %s character', (quote) => {
    expect(removeQuotes(quote)).toBe('');
  });

  it.each([
    '',
    'findMany',
    'f',
    '"findMany',
    'findMany"',
    "'findMany",
    "findMany'",
    '`findMany',
    'findMany`',
    '"findMany\'',
    "'findMany`",
    '`findMany"',
    'find"Many',
    "find'Many",
    'find`Many',
    ' "findMany" ',
  ])('leaves %j unchanged without matching outer quotes', (value) => {
    expect(removeQuotes(value)).toBe(value);
  });

  it.each(['"', "'", '`'])('removes only one outer pair of %s quotes', (quote) => {
    expect(removeQuotes(`${quote}${quote}findMany${quote}${quote}`)).toBe(
      `${quote}findMany${quote}`,
    );
  });

  it('preserves inner quotes and spaces', () => {
    expect(removeQuotes('" find\'Many `user` "')).toBe(" find'Many `user` ");
  });
});
