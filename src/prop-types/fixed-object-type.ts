import { objectTypeParser } from '../object-type-parser';
import { Type } from './type';
import { capitalize } from '../utils';
import { TypeFactory, TypeMetadata } from './types';

export class FixedObjectType extends Type {
  name: string;
  typeString: string;
  fields: { name: string; type: Type }[];

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    switch (metadata.kind) {
      case 'component-property':
        this.name = metadata.propMeta.name;
        this.typeString = metadata.propMeta.complexType.resolved;
        break;

      case 'object-field':
        this.name = metadata.name;
        this.typeString = metadata.type;
        break;
    }

    // strip "undefined | " from the start of the type of an optional prop
    const resolvedType = this.typeString.replace(/^undefined \| /, '');
    this.fields = objectTypeParser(resolvedType)
      .fields()
      .map(({ name, type }) => ({
        name,
        type: typeFactory({ kind: 'object-field', name, type }),
      }));
  }

  isSupported(): boolean {
    return this.fields.every(({ type }) => type.isSupported());
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

  private customTypeFields(): string[] {
    return this.fields.map(
      ({ name, type }) => `${name} : ${type.annotation()}`,
    );
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
            (field) =>
              `( "${field.name}", ${
                field.type.jsonEncoderName()
                  ? `${field.type.jsonEncoderName()} `
                  : ''
              }${this.name}.${field.name} )`,
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

  isSettableAsElementAttribute(): boolean {
    return false;
  }
}
