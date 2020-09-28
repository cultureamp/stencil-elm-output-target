import { capitalize } from '../utils';
import { Type } from './type';

export class EnumeratedStringType extends Type {
  isCompatibleWithMetadata(): boolean {
    // '"foo" | "bar" | "baz"'
    return (
      this.typeString.match(
        /^(undefined \| )?"[^"]*"( \| ("[^"]*"|undefined))*$/,
      ) !== null
    );
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

  private customTypeConstructors(): string[] {
    return this.stringValues().map(this.constructorForStringValue, this);
  }

  private stringValues() {
    return this.typeString.split(' | ').flatMap((str) => {
      try {
        return str !== 'undefined' ? [JSON.parse(str)] : [];
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
