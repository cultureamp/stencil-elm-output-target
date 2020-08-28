import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';

export type PropTypeFactory = (
  cmpMeta: ComponentCompilerMeta,
  propMeta: ComponentCompilerProperty,
  nestedType?: { original: string; resolved: string },
) => Type;

export class Type {
  tagName: string;
  propTypeFromMetadata: PropTypeFactory;

  constructor(
    cmpMeta: ComponentCompilerMeta,
    propMeta: ComponentCompilerProperty,
    propTypeFromMetadata: PropTypeFactory,
    complexType: { original: string; resolved: string },
  ) {
    this.tagName = cmpMeta.tagName;
    this.propTypeFromMetadata = propTypeFromMetadata;
  }

  isSupported(): boolean {
    throw new Error('not implemented');
  }

  annotation(): string {
    throw new Error('not implemented');
  }

  customTypeNames(): string[] {
    throw new Error('not implemented');
  }

  customTypeDeclarations(): string[] {
    throw new Error('not implemented');
  }

  typeAliasNames(): string[] {
    throw new Error('not implemented');
  }

  typeAliasDeclarations(): string[] {
    throw new Error('not implemented');
  }

  attributeEncoderName(): string | null {
    throw new Error('not implemented');
  }

  encoders(): string[] {
    throw new Error('not implemented');
  }

  attributeFunction(): 'attribute' | 'property' {
    throw new Error('not implemented');
  }

  isSettableAsElementAttribute(): boolean {
    throw new Error('not implemented');
  }
}
