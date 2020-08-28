import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { objectTypeParser } from '../object-type-parser';
import { PropTypeFactory, Type } from './type';
import { capitalize } from '../utils';

export class FixedObjectType extends Type {
  name: string;
  fields: { name: string; type: Type }[];

  constructor(
    cmpMeta: ComponentCompilerMeta,
    propMeta: ComponentCompilerProperty,
    propTypeFromMetadata: PropTypeFactory,
    complexType: { original: string; resolved: string },
  ) {
    super(cmpMeta, propMeta, propTypeFromMetadata, complexType);

    this.name = propMeta.name;

    // strip "undefined | " from the start of the type of an optional prop
    const resolvedType = complexType.resolved.replace(/^undefined \| /, '');
    this.fields = objectTypeParser(resolvedType)
      .fields()
      .map(({ name, type }) => ({
        name,
        type: propTypeFromMetadata(cmpMeta, propMeta, {
          original: type,
          resolved: type,
        }),
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

  encoders(): string[] {
    return [
      [
        `${this.name}Encoder : ${this.typeAliasName()} -> Value`,
        `${this.name}Encoder ${this.name} =`,
        `    Encode.object`,
        `        [ ${this.fields
          .map(
            (field) =>
              `( "${field.name}", TODO_ENCODER ${this.name}.${field.name} )`,
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
