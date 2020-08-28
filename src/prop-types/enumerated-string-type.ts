import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { capitalize } from '../utils';
import { PropTypeFactory, Type } from './type';

export class EnumeratedStringType extends Type {
  name: string;
  complexType: string; // '"foo" | "bar" | "baz"'

  constructor(
    cmpMeta: ComponentCompilerMeta,
    propMeta: ComponentCompilerProperty,
    propTypeFromMetadata: PropTypeFactory,
    complexType: { original: string; resolved: string },
  ) {
    super(cmpMeta, propMeta, propTypeFromMetadata, complexType);

    this.name = propMeta.name;
    this.complexType = complexType.original;
  }

  isSupported(): boolean {
    return true;
  }

  annotation(): string {
    return this.customTypeName();
  }

  customTypeNames(): string[] {
    return [this.customTypeName()];
  }

  private customTypeName(): string {
    return capitalize(this.name);
  }

  customTypeDeclarations(): string[] {
    return [
      [
        `type ${this.customTypeName()}`,
        `    = ${this.customTypeConstructors().join('\n    | ')}`,
      ].join('\n'),
    ];
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

  attributeEncoderName(): string {
    return `${this.name}ToString`;
  }

  encoders(): string[] {
    return [
      [
        [
          `${this.attributeEncoderName()} : ${this.customTypeName()} -> String`,
          `${this.attributeEncoderName()} ${this.name} =`,
          `    case ${this.name} of`,
        ],
        this.stringValues().map((value) =>
          [
            `        ${this.constructorForStringValue(value)} ->`,
            `            "${value}"\n`,
          ].join('\n'),
        ),
      ]
        .flat()
        .join('\n'),
    ];
  }

  typeAliasNames(): string[] {
    return [];
  }

  typeAliasDeclarations(): string[] {
    return [];
  }

  isSettableAsElementAttribute(): boolean {
    return true;
  }
}
