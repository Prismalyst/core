import path from 'node:path';
import * as TS from 'typescript';

export function createTestSourceFile(fixturePath: string): TS.SourceFile {
  const absoluteFixturePath = path.resolve(fixturePath);
  const sourceText = TS.sys.readFile(absoluteFixturePath);

  if (sourceText === undefined) {
    throw new Error(`Fixture "${absoluteFixturePath}" could not be read.`);
  }

  return TS.createSourceFile(absoluteFixturePath, sourceText, TS.ScriptTarget.Latest, true);
}
