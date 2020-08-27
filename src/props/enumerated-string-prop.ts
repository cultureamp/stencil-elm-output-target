import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { capitalize } from '../utils';
import { Prop } from './prop';

export class EnumeratedStringProp extends Prop {
  complexType: string; // '"foo" | "bar" | "baz"'

  constructor(cmpMeta: ComponentCompilerMeta, prop: ComponentCompilerProperty) {
    super(cmpMeta, prop);

    this.complexType = prop.complexType.original;
  }

  isSupported(): boolean {
    return true;
  }

  customTypeDeclaration(): string {
    return [
      `type ${this.customTypeName()}`,
      `    = ${this.customTypeConstructors().join('\n    | ')}`,
    ].join('\n');
  }

  customTypeEncoder(): string {
    return [
      [
        `${this.attributeName()}ToString : ${this.customTypeName()} -> String`,
        `${this.attributeName()}ToString ${this.attributeName()} =`,
        `    case ${this.attributeName()} of`,
      ],
      this.stringValues().map((value) =>
        [
          `        ${this.constructorForStringValue(value)} ->`,
          `            "${value}"\n`,
        ].join('\n'),
      ),
    ]
      .flat()
      .join('\n');
  }

  private customTypeConstructors() {
    return this.stringValues().map(this.constructorForStringValue, this);
  }

  private stringValues() {
    return this.complexType.split(' | ').map((str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(
            `Component "${this.tagName}" prop "${this.name}" value ${str} cannot be parsed as a JavaScript string.`,
          );
        }
        throw e;
      }
    });
  }

  private constructorForStringValue(str: string): string {
    if (str.match(/[a-z]+/i)) {
      return capitalize(str);
    }

    throw new Error(
      `Component "${this.tagName}" prop "${this.name}" value "${str}" cannot be converted to an Elm custom type constructor name. This should be a relatively easy enhancement to the Elm output target if you need to support it, however.`,
    );
  }

  customTypeName(): string {
    return capitalize(this.name);
  }

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}${this.customTypeName()}`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return this.required
      ? `Just (attribute "${this.name}" (${this.attributeName()}ToString ${
          (!isOnly && 'attributes.') || ''
        }${this.attributeName()}))`
      : [
          `Maybe.map`,
          `            (\\value -> attribute "${
            this.name
          }" (${this.attributeName()}ToString value))`,
          `            ${
            (!isOnly && 'attributes.') || ''
          }${this.attributeName()}`,
        ].join('\n');
  }
}
