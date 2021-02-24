export default interface LogEvent {
  level: 'debug' | 'error' | 'warning' | 'log'
  message: any
  timestamp: string
}
