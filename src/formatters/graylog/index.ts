import { ExposeableField, LogEvent } from '../../@types/interfaces';

const stringify = require('json-stringify-safe');
const { TextEncoder, TextDecoder } = require('util');

const exposeFields = (event: any, fieldsToExpose: Array<ExposeableField>) => {
  const json = stringify(event);

  const exposed = fieldsToExpose.reduce((resultantFields: any, field) => {
    const regExp = new RegExp(`(?:.*${field.fieldName}"?[:\\s]*["']?)([^"']*)(.*)`);
    const accumulatedResult: any = { ...resultantFields };

    if (json.match(regExp)) {
      accumulatedResult[field.alias || field.fieldName] = json.replace(regExp, '$1');
    }

    return accumulatedResult;
  }, {} as any);

  return exposed;
};

const measureChunkMessage = (messageHeader: any, message: any, logLimit: number) => {
  const encoder = new TextEncoder();
  const flagSize = encoder.encode(stringify({ chunk: '999/999' })).length; // measure chunk marker
  const headerSize = encoder.encode(messageHeader).length;
  const messageFullSize = encoder.encode(stringify(stringify(message))).length;
  const bufferSize = logLimit - headerSize - flagSize;

  return {
    bufferSize,
    chunks: Math.ceil(messageFullSize / bufferSize),
  };
};

const chunkMessage = (messageHeader: any, message: any, logLimit: number) => {
  if (!logLimit) return { ...messageHeader, log_message: message };

  const header = { ...messageHeader, log_message: '@' };
  const chunkMeasure = measureChunkMessage(header, message, logLimit);
  const encodedMessage = new TextEncoder().encode(stringify(message));

  if (chunkMeasure.chunks === 1) return { ...messageHeader, log_message: message };
  const chunks = [];

  for (let chunk = 0; chunk < chunkMeasure.chunks; chunk += 1) {
    chunks.push(stringify({ ...header, chunk: `${chunk + 1}/${chunkMeasure.chunks}` })
      .replace('"@"', new TextDecoder()
        .decode(encodedMessage.slice(chunk * logLimit, (chunk + 1) * logLimit))));
  }

  return { chunked: true, chunks };
};

export default function graylog(
  event: LogEvent, fieldsToExpose: Array<ExposeableField> = [], logLimit: number,
) {
  const {
    level, message, timestamp, ...eventForGraylog
  } = { ...event };

  const messageHeader = Object.assign(eventForGraylog, {
    ...exposeFields(event, fieldsToExpose),
    log_level: level,
    log_timestamp: timestamp,
  });

  return chunkMessage(messageHeader, message, logLimit);
}
