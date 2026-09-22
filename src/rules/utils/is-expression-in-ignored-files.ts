// TODO: add regexp ignoredFiles (like "./src/**/*.{ts,tsx}", "./prisma/**/*.{ts,tsx}" and etc.)

export function isExpressionInIgnoredFiles(filename: string, ignoredFiles: string[]) {
  return ignoredFiles.some((ignoredFile) => filename.includes(ignoredFile));
}
