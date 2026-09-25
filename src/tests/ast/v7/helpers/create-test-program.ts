import path from 'node:path';
import * as TS from 'typescript';

type TestProgram = {
  program: TS.Program;
  sourceFile: TS.SourceFile;
  checker: TS.TypeChecker;
};

const tsconfigPath = path.resolve('tsconfig.json');

const configFile = TS.readConfigFile(tsconfigPath, TS.sys.readFile);

if (configFile.error) {
  throw new Error(TS.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
}

const parsedConfig = TS.parseJsonConfigFileContent(
  configFile.config,
  TS.sys,
  path.dirname(tsconfigPath),
);

if (parsedConfig.errors.length > 0) {
  throw new Error(
    parsedConfig.errors
      .map((error) => TS.flattenDiagnosticMessageText(error.messageText, '\n'))
      .join('\n'),
  );
}

const compilerOptions = parsedConfig.options;

export function createTestProgram(fixturePath: string): TestProgram {
  const absoluteFixturePath = path.resolve(fixturePath);

  const program = TS.createProgram({
    rootNames: [absoluteFixturePath],
    options: compilerOptions,
  });

  const sourceFile = program.getSourceFile(absoluteFixturePath);

  if (!sourceFile) {
    throw new Error(`Fixture "${absoluteFixturePath}" was not found in program.`);
  }

  return {
    program,
    sourceFile,
    checker: program.getTypeChecker(),
  };
}
