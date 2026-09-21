export function isExpressionInTestFile(filename: string): boolean {
  return filename.includes('.test.') || filename.includes('.spec.');
}
