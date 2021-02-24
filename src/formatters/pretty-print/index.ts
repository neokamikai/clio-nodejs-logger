import _ from 'lodash';
import prettyjson from 'prettyjson';
import { LogEvent } from '../../@types/interfaces';

/**
 * Default options for prettyjson
 */
const PrettyJsonDefaultOptions = Object.freeze({
  defaultIndentation: 4,
  inlineArrays: 1,
});

export default function prettyPrint(event: LogEvent) {
  const header = `[${event.timestamp}]: [${event.message}]`;
  const eventDetails = _.omit(event, 'timestamp', 'message');
  const body = prettyjson
    .render(eventDetails, _.clone(PrettyJsonDefaultOptions as any))
    .replace(/\n/g, '\n\t');

  return `\n${header}\n\t${body}\n\n`;
}
