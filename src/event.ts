import {
  ComponentCompilerEvent,
  ComponentCompilerMeta,
  Config,
} from '@stencil/core/internal';

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

export class Event {
  // TODO support decoding CustomEvent detail values
  tagName: string;
  name: string;

  constructor(cmpMeta: ComponentCompilerMeta, event: ComponentCompilerEvent) {
    this.tagName = cmpMeta.tagName;
    this.name = event.name;
  }

  isSupported(): boolean {
    return true;
  }

  customTypeNames(): string[] {
    return [];
  }

  customTypeDeclarations(): string[] {
    return [];
  }

  encoders(): string[] {
    return [];
  }

  typeAliasNames(): string[] {
    return [];
  }

  typeAliasDeclarations(): string[] {
    return [];
  }

  fieldTypeAnnotation(): string {
    return `${this.attributeName()} : ${this.argTypeAnnotation()}`;
  }

  attributeName(): string {
    return this.eventHandlerName();
  }

  argTypeAnnotation(): string {
    return 'Maybe msg';
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    const attribute = (!isOnly ? 'attributes.' : '') + this.eventHandlerName();

    return [
      `${attribute} |> `,
      `Maybe.map (`,
      `Decode.succeed >> on "${this.name}"`,
      `)`,
    ].join('');
  }

  private eventHandlerName() {
    return `on${this.name.charAt(0).toUpperCase() + this.name.slice(1)}`;
  }
}
