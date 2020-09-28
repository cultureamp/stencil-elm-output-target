import parser from './fixed-object-type/parser';
import { Type } from './type';
import { capitalize } from '../utils';
import { TypeFactory, TypeMetadata } from './types';

export class FixedObjectType extends Type {
  fields: { name: string; type: Type }[];
  fieldParserError?: Error;

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    const resolvedType = this.typeString
      // strip "undefined | " from the start of the type of an optional prop
      .replace(/^undefined \| /, '')
      // Stencil sometimes wraps objects in parens - strip them off
      .replace(/^\((.*)\)$/, '$1');
    try {
      this.fields = parser(resolvedType)
        .fields()
        .map(({ name, type }: { name: string; type: string }) => ({
          name,
          type: typeFactory({ name, type }),
        }));
    } catch (parserError) {
      this.fields = [];
      this.fieldParserError = parserError;
    }
  }

  isCompatibleWithMetadata(): boolean {
    return this.fieldParserError === undefined;
  }

  annotation(): string {
    return this.typeAliasName();
  }

  customTypeNames(): string[] {
    return this.fields.flatMap(({ type }) => type.customTypeNames());
  }

  customTypeDeclarations(): string[] {
    return this.fields.flatMap(({ type }) => type.customTypeDeclarations());
  }

  attributeEncoderName(): string {
    return `${this.name}Encoder`;
  }

  jsonEncoderName(): string {
    return this.attributeEncoderName();
  }

  encoders(): string[] {
    return [
      [
        `${this.name}Encoder : ${this.typeAliasName()} -> Value`,
        `${this.name}Encoder ${this.name} =`,
        `    Encode.object`,
        `        [ ${this.fields
          .map(
            ({ name, type }) =>
              `( "${name}", ${
                type.jsonEncoderName() ? `${type.jsonEncoderName()} ` : ''
              }${this.name}.${name} )`,
          )
          .join('\n        , ')}`,
        `        ]`,
      ]
        .flat()
        .join('\n'),
      ...this.fields.flatMap(({ type }) => type.encoders()),
    ];
  }

  typeAliasNames(): string[] {
    return [
      this.typeAliasName(),
      ...this.fields.flatMap(({ type }) => type.typeAliasNames()),
    ];
  }

  private typeAliasName(): string {
    return capitalize(this.name);
  }

  typeAliasDeclarations(): string[] {
    return [
      [
        `type alias ${this.typeAliasName()} =`,
        `    { ${this.customTypeFields().join('\n    , ')}`,
        `    }`,
      ].join('\n'),
      ...this.fields.flatMap(({ type }) => type.typeAliasDeclarations()),
    ];
  }

  private customTypeFields(): string[] {
    return this.fields.map(
      ({ name, type }) => `${name} : ${type.annotation()}`,
    );
  }

  isSettableAsElementAttribute(): boolean {
    return false;
  }
}
