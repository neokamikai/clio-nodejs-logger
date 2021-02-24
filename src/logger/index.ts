/* eslint-disable max-lines,max-len */
import domain from 'domain';
import stringify from 'json-stringify-safe';
import { prettyPrint } from '../formatters';
import eventFormatter from '../event-formatter';
import isEnabled from '../is-enabled';
import Serializer from '../serializer';
import loggerLevels from '../levels';
import logLevelFilter from '../log-level-filter';
import { LoggerContextData } from '../@types/interfaces/logger-context-data';
import LogLevel from '../@types/types/log-level';
import { ExposeableField } from '../@types/interfaces';

const AsyncHooksStorage = require('@naturacosmeticos/async-hooks-storage');

AsyncHooksStorage.enable();
AsyncHooksStorage.newEntry('Logger');

/**
 * default values for Logger instance
 * @private
 */
const DEFAULT_LOGGER_ATTRIBUTES = {
  flipLevelPattern: process.env.FLIP_LOG_PATTERN,
  logFormat: process.env.LOG_FORMAT,
  logLevel: process.env.LOG_LEVEL || loggerLevels.error,
  logLimit: process.env.LOG_LIMIT || 7000,
  logPatterns: process.env.LOG_NAMESPACES || undefined,
  namespace: '',
};

/** @private */
function normalizeArguments(options: any, extraParameters: any) {
  if (!options) return DEFAULT_LOGGER_ATTRIBUTES;

  if (!extraParameters.length) return { ...DEFAULT_LOGGER_ATTRIBUTES, ...options };

  const [namespace, logPatterns, logLimit, logLevel] = extraParameters;

  return {
    context: options, logLevel, logLimit, logPatterns, namespace,
  };
}

/**
 * Basic Logger usage
 * @example
 * const apiLogger = new Logger({
 *  context: { api: 'myAwesomeAPI' }
 *  logLevel: 'error',
 *  logLimit: 7000,
 *  logPatterns: '',
 *  namespace: ''
 * });
 *
 * apiLogger.warn('Before doing any requests check your connection')
 * apiLogger.info('GET request for 127.0.0.1/myAwesomeAPI')
 * apiLogger.error('Bad request', { errorData })
 */
class Logger {
  private m_namespace: string;

  private m_logPatterns: string;

  private m_contextData: LoggerContextData;

  private flipLevelPattern: string;

  format: Function;

  private m_logFormat: string;

  private m_logLevel: string;

  private m_logLimit: number;

  private serializer: Serializer;

  get namespace() { return this.m_namespace; }

  get contextData() { return this.m_contextData; }

  get logFormat() { return this.m_logFormat; }

  get logLevel() { return this.m_logLevel; }

  get logLimit() { return this.m_logLimit; }

  get logPatterns() { return this.m_logPatterns; }

  /**
   * Initialize a Logger instance, using prettyjson when LOGS_PRETTY_PRINT is set
   * @param options - A collection of options
   *
   * It's possible to create logger using the following syntax:
   *
   * `new Logger(context, namespace, logPatterns, logLimit, logLevel)`
   *
   * However, this method is deprecated prior to object options
   *
   * It will not be possible to use that method on next major release
   */
  // eslint-disable-next-line max-lines-per-function
  constructor(options: any, ...extraParameters: any) {
    const {
      context,
      flipLevelPattern,
      namespace,
      logFormat,
      logPatterns,
      logLimit,
      logLevel,
    } = normalizeArguments(options, extraParameters);

    this.m_namespace = namespace;
    this.m_contextData = { context, name: `${process.env.APP_NAME}`.replace(/^undefined|null$/, '') };
    this.flipLevelPattern = flipLevelPattern;
    this.format = process.env.LOGS_PRETTY_PRINT === '1' ? prettyPrint : stringify;
    this.m_logFormat = logFormat;
    this.m_logLevel = logLevel;
    this.m_logLimit = logLimit;
    this.m_logPatterns = logPatterns;
    this.serializer = new Serializer({ context, name: process.env.APP_NAME }, namespace, logLimit);
  }

  log(message: any, additionalArguments?: any) {
    return this.info(message, additionalArguments);
  }

  /**
   * Returns a new logger with the same contextual information and a child namespace
   * @param {string} namespace - namespace to be appended to the current one in the new instance
   *
   * `appLogger = new Logger({ namespace: 'docs', ...otherOptions }) // namespace: docs`
   *
   * `childLogger = appLogger.createChildLogger('child') // namespace: docs:child`
   *
   * @returns Logger
   */
  createChildLogger(namespace: string) {
    const prefix = this.namespace ? `${this.namespace}:` : '';

    const { logPatterns } = this;

    return new Logger({ context: this.contextData.context, logPatterns, namespace: `${prefix}/${namespace}` });
  }

  /**
   * Sets value to a transactional context variable
   */
  setArguments(value: any) {
    AsyncHooksStorage.setEntry('logArguments', value);
  }

  /**
   * Logs a message using stdout
   * @param message - the message to be logged
   * @param additionalArguments - object with additional info to be logged
   */
  info(message: any, additionalArguments: any = {}) {
    this.output(message, additionalArguments);
  }

  /**
   * Logs level warn a message using stdout
   * @param message - the message to be logged
   * @param additionalArguments - object with additional info to be logged
   */
  warn(message: any, additionalArguments: any = {}) {
    this.output(message, additionalArguments, loggerLevels.warn);
  }

  /**
   * Logs level error a message using stdout
   * @param {Object} message - the message to be logged
   * @param {Object} [additionalArguments] - object with additional info to be logged
   */
  error(message: any, additionalArguments: any = {}) {
    this.output(message, additionalArguments, loggerLevels.error);
  }

  /**
   * Logs a message using stdout only if the debug mode is enabled
   * @param {Object} message - the message to be logged
   * @param {Object} [additionalArguments] - object with additional info to be logged
   */
  debug(message: any, additionalArguments: any = {}) {
    this.output(message, additionalArguments, loggerLevels.debug);
  }

  /**
   * Set sessionId on context in contextData
   *
   * It's preferable to set Logger sessionId as a context attribute upon creation
   *
   * `new Logger({ context: { sessionId: uuid(), ...otherParameters } })`
   *
   * This method will be removed on the next major release
   *
   * @param sessionId
   * @deprecated
   */
  setSessionId(sessionId: string) {
    this.contextData.context = {
      ...this.contextData.context, sessionId,
    };
  }

  private output(message: any, additionalArguments: any, outputType: LogLevel = loggerLevels.log) {
    if (this.shouldSuppressOutput(message, outputType)) return;
    const event = this.serializer.serialize(
      message, { ...additionalArguments, contextData: this.contextData }, outputType,
    );
    const fieldsToExpose = Object.keys(AsyncHooksStorage.getEntry('logArguments') || {})
      .reduce((acc, key) => [...acc, { fieldName: key }], [] as Array<ExposeableField>);
    const formattedLog = eventFormatter(event, fieldsToExpose, this.logFormat as any, this.logLimit);

    // eslint-disable-next-line no-console
    if (!formattedLog.chunked) console.log(`${this.format(formattedLog)}`);
    // eslint-disable-next-line no-console
    else formattedLog.chunks.map((chunk: any) => console.log(`${this.format(chunk)}`));
  }

  private shouldSuppressOutput(message: any, outputType: any) {
    // force enable log if flipLevelPattern is matched over message
    const flipLog = this.flipLevelPattern
    && stringify(message).match(new RegExp(this.flipLevelPattern));

    return (!flipLog) && [
      logLevelFilter({ logLevel: this.logLevel, outputType }),
      isEnabled(this.namespace, this.logPatterns),
    ].some((response) => response !== true);
  }

  /**
   * Returns the current Logger instance in the active domain
   * or an instance without contextual information if there is no active domain.
   */
  static current(): Logger {
    return (!(domain as any).active) ? new Logger({}) : (domain as any).active.logger;
  }
}

export default Logger;
