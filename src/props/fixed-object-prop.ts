import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { objectTypeParser } from '../object-type-parser';
import { capitalize } from '../utils';
import { Prop } from './prop';
import { UnsupportedProp } from './unsupported-prop';

export class FixedObjectProp extends Prop {
  complexType: string; // { key1: type1, key2: type2 }
  _fields: Prop[];

  constructor(cmpMeta: ComponentCompilerMeta, prop: ComponentCompilerProperty) {
    super(cmpMeta, prop);

    // strip "undefined | " from the start of the type of an optional prop
    this.complexType = prop.complexType.resolved.replace(/^undefined \| /, '');
    this._fields = objectTypeParser(this.complexType)
      .fields()
      .map(
        ({ name, type }) =>
          new UnsupportedProp(cmpMeta, { name, type, required: false }),
      );
  }

  isSupported(): boolean {
    return true; // this.fields().every((field) => field.isSupported());
  }

  private fields(): Prop[] {
    return this._fields;
  }

  customTypeDeclaration(): string {
    return [
      `type alias ${this.customTypeName()} =`,
      `    { ${this.customTypeFields().join('\n    , ')}`,
      `    }`,
    ].join('\n');
  }

  private customTypeFields(): string[] {
    return this.fields().map((field) => `${field.name} : TODO_TYPE`);
  }

  customTypeEncoder(): string {
    return [
      `${this.attributeName()}Encoder : ${this.customTypeName()} -> Value`,
      `${this.attributeName()}Encoder ${this.attributeName()} =`,
      `    Encode.object`,
      `        [ ${this.fields()
        .map(
          (field) =>
            `( "${field.name}", TODO_ENCODER ${this.attributeName()}.${
              field.name
            } )`,
        )
        .join('\n        , ')}`,
      `        ]`,
    ]
      .flat()
      .join('\n');
  }

  customTypeName(): string {
    return capitalize(this.name);
  }

  attributeName(): string {
    return this.name;
  }

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}${this.customTypeName()}`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return this.required
      ? `Just (property "${this.name}" (${this.attributeName()}Encoder ${
          (!isOnly && 'attributes.') || ''
        }${this.attributeName()}))`
      : [
          `Maybe.map`,
          `            (\\value -> property "${
            this.name
          }" (${this.attributeName()}Encoder value))`,
          `            ${
            (!isOnly && 'attributes.') || ''
          }${this.attributeName()}`,
        ].join('\n');
  }
}
