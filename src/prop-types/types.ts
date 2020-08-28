import { ComponentCompilerProperty } from '@stencil/core/internal';

export type TypeFactory<type> = (metadata: TypeMetadata) => type;

export type TypeMetadata = ComponentPropertyMetadata | ObjectFieldMetadata;

export type ComponentPropertyMetadata = {
  kind: 'component-property';
  propMeta: ComponentCompilerProperty;
};

export type ObjectFieldMetadata = {
  kind: 'object-field';
  name: string;
  type: string;
};
