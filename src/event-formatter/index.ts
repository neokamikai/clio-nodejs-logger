import { ExposeableField, LogEvent } from '../@types/interfaces';
import * as allFormatters from '../formatters';

const formatters = {
  ...allFormatters,
};

export default function eventFormatter(
  event: LogEvent, fieldsToExpose: Array<ExposeableField>,
  format: 'graylog' | 'prettyPrint', logLimit: number,
) {
  const logFormat = formatters[format];

  if (!logFormat) return event;

  return logFormat(event, fieldsToExpose, logLimit);
}
