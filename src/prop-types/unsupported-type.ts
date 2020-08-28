import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { PropTypeFactory, Type } from './type';

export class UnsupportedType extends Type {
  original: string;
  resolved: string;

  constructor(
    cmpMeta: ComponentCompilerMeta,
    propMeta: ComponentCompilerProperty,
    propTypeFromMetadata: PropTypeFactory,
    complexType: { original: string; resolved: string },
  ) {
    super(cmpMeta, propMeta, propTypeFromMetadata, complexType);

    // Store for inspection in a debugger if necessary
    this.original = complexType.original;
    this.resolved = complexType.resolved;
  }

  isSupported(): boolean {
    return false;
  }
}
