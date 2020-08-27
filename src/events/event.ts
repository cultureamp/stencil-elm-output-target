import {
  ComponentCompilerEvent,
  ComponentCompilerMeta,
} from '@stencil/core/internal';

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

  customTypeDeclaration(): null {
    return null;
  }

  customTypeEncoder(): null {
    return null;
  }

  customTypeName(): null {
    return null;
  }

  configFieldTypeAnnotation(): string {
    return `${this.attributeName()} : ${this.configArgTypeAnnotation()}`;
  }

  attributeName(): string {
    return this.eventHandlerName();
  }

  configArgTypeAnnotation(): string {
    return 'Maybe msg';
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return [
      `Maybe.map`,
      `            (\\msg -> on "${this.name}" (Decode.succeed msg))`,
      `            ${
        (!isOnly && 'attributes.') || ''
      }${this.eventHandlerName()}`,
    ].join('\n');
  }

  private eventHandlerName() {
    return `on${this.name.charAt(0).toUpperCase() + this.name.slice(1)}`;
  }
}
