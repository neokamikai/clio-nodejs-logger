import Logger from '../logger';

declare module 'domain' {
  interface Domain {
    logger: Logger
  }
}
