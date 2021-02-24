/** @private */
function buildMatchPattern(namespace: string) {
  return (pattern: string) => {
    if (pattern === '') return false;

    return new RegExp(pattern.replace('*', '.*')).test(namespace);
  };
}

interface CreatePatternsParams {
  excludingPatterns: Array<string>
  includingPatterns: Array<string>
}

function createPatterns({
  excludingPatterns, includingPatterns,
}: CreatePatternsParams, nextPattern: string) {
  if (nextPattern.startsWith('-')) {
    return {
      excludingPatterns: excludingPatterns.concat(nextPattern.substring(1)),
      includingPatterns,
    };
  }

  return {
    excludingPatterns,
    includingPatterns: includingPatterns.concat(nextPattern),
  };
}

/** @private */
export default (namespace: string, enabledNamespaces?: string) => {
  if (!enabledNamespaces) return false;

  const { excludingPatterns, includingPatterns } = enabledNamespaces
    .split(',')
    .reduce(createPatterns, { excludingPatterns: [], includingPatterns: [] });

  if (excludingPatterns.some(buildMatchPattern(namespace), { namespace })) return false;

  if (includingPatterns.some(buildMatchPattern(namespace), { namespace })) return true;

  return false;
};
