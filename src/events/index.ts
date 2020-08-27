import {
  ComponentCompilerEvent,
  ComponentCompilerMeta,
  Config,
} from '@stencil/core/internal';
import { Event } from './event';

export function eventFromMetadata(
  config: Config,
  cmpMeta: ComponentCompilerMeta,
  eventMeta: ComponentCompilerEvent,
): Event {
  const event = new Event(cmpMeta, eventMeta);

  if (!event.isSupported()) {
    config.logger?.warn(
      `Component "${cmpMeta.tagName}" event "${eventMeta.name}" is not supported by Elm output target.`,
    );
  }

  return event;
}

export { Event } from './event';
