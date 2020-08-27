import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { objectTypeParser } from '../object-type-parser';
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
    return this.fields().every((field) => field.isSupported());
  }

  fields(): Prop[] {
    return this._fields;
  }
}
