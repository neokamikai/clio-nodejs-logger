import LogLevel from '../../types/log-level';

export default interface LoggerOptions {
  /**
   * Logger context, accepts any value type
   */
  context: any
  /**
   * Logger level, available options:
   * * debug
   * * log
   * * warn
   * * error
   */
  logLevel: LogLevel
  /**
   * Number in bytes for maximum size of
   * @default 7000
   */
  logLimit: number
  /**
   * Pattern to log. `logPatterns: 'api,database'`
   */
  logPatterns: string
}
