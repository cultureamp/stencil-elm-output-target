import { Prop } from './prop';

export class AnyObjectProp extends Prop {
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
    // TODO import Json.Encode.Value
    return `${!this.required ? 'Maybe ' : ''}Value`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    // TODO import Html.Attributes.property
    return this.required
      ? `Just (property "${this.name}" ${
          (!isOnly && 'attributes.') || ''
        }${this.attributeName()})`
      : `Maybe.map (property "${this.name}") ${
          (!isOnly && 'attributes.') || ''
        }${this.attributeName()}`;
  }
}
