import { capitalize } from '../utils';
import { Type } from './type';
import { TypeFactory, TypeMetadata } from './types';

export class EnumeratedStringType extends Type {
  name: string;
  typeString: string; // '"foo" | "bar" | "baz"'

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    switch (metadata.kind) {
      case 'component-property':
        this.name = metadata.propMeta.name;
        this.typeString = metadata.propMeta.complexType.original;
        break;

      case 'object-field':
        this.name = metadata.name;
        this.typeString = metadata.type;
        break;
    }
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
    return this.typeString.split(' | ').map((str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(
            `Prop "${this.name}" value ${str} cannot be parsed as a JavaScript string.`,
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
      `Prop "${this.name}" value "${str}" cannot be converted to an Elm custom type constructor name. This should be a relatively easy enhancement to the Elm output target if you need to support it, however.`,
    );
  }

  attributeEncoderName(): string {
    return `${this.name}ToString`;
  }

  jsonEncoderName(): string {
    return `(${this.attributeEncoderName()} >> Encode.string)`;
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
