import { Prop } from './prop';

export class BooleanProp extends Prop {
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
    return `${!this.required ? 'Maybe ' : ''}Bool`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return (this.required
      ? [
          `Just (attribute "${this.name}"`,
          `            (if ${
            (!isOnly && 'attributes.') || ''
          }${this.attributeName()} then`,
          `                "true"`,
          ``,
          `             else`,
          `                "false"`,
          `            ))`,
        ]
      : [
          `Maybe.map`,
          `            (\\value ->`,
          `                attribute "${this.name}"`,
          `                    (if value then`,
          `                        "true"`,
          ``,
          `                     else`,
          `                        "false"`,
          `                    )`,
          `            )`,
          `            ${
            (!isOnly && 'attributes.') || ''
          }${this.attributeName()}`,
        ]
    ).join('\n');
  }
}
