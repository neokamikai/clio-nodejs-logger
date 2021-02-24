import os from 'os';
import LogLevel from '../@types/types/log-level';

const AsyncHooksStorage = require('@naturacosmeticos/async-hooks-storage');

export default class Serializer {
  protected contextData: any;

  protected namespace: string;

  protected logLimit: number;

  constructor(contextData: any, namespace: any, logLimit: number) {
    this.contextData = contextData;
    this.namespace = namespace;
    this.logLimit = logLimit;
  }

  serialize(message: any, additionalArguments: any, level: LogLevel) {
    const timestamp = new Date().toISOString();
    const event = this.event(message, additionalArguments, level, timestamp);

    return event;
  }

  /**
   *  @private
   */
  event(message: any, additionalArguments: any, level: LogLevel, timestamp: string) {
    return {
      ...AsyncHooksStorage.getEntry('logArguments'),
      ...additionalArguments,
      ...this.contextData,
      level,
      message,
      namespace: this.namespace,
      timestamp,
      uptime: os.uptime(),
    };
  }
}
