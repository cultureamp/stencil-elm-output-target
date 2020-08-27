import { Prop } from './prop';

export class StringProp extends Prop {
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

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}String`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return this.required
      ? `Just (attribute "${this.name}" ${
          (!isOnly && 'attributes.') || ''
        }${this.attributeName()})`
      : `Maybe.map (attribute "${this.name}") ${
          (!isOnly && 'attributes.') || ''
        }${this.attributeName()}`;
  }
}
