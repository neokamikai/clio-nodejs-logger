import LOG_LEVELS from '../levels';

const {
  debug, error, warn, log,
} = LOG_LEVELS;

/** @private */
const LOG_LEVEL: Array<'debug' | 'error' | 'warn' | 'log'> = Object.freeze([debug, log, warn, error]) as any;

/** @private */
const levelOutputMatchers = [
  function debugOutput({ logLevel, outputType }: any) {
    return logLevel === debug && LOG_LEVEL.includes(outputType);
  },
  function infoOutput({ logLevel, outputType }: any) {
    return logLevel === log && LOG_LEVEL.slice(1).includes(outputType);
  },
  function warnOutput({ logLevel, outputType }: any) {
    return logLevel === warn && LOG_LEVEL.slice(2).includes(outputType);
  },
  function errorOutput({ logLevel, outputType }: any) {
    return logLevel === error && LOG_LEVEL.slice(3).includes(outputType);
  },
];

/**
 * It matches logLevel and outputType and returns if log request
 * should or should not be logged
 * @private */
function logLevelFilter({ logLevel, outputType }: any) {
  return levelOutputMatchers.some((matcher) => matcher({ logLevel, outputType }));
}

logLevelFilter.LOG_LEVEL = LOG_LEVEL;

export default logLevelFilter;
