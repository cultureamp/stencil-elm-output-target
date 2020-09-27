import { ComponentCompilerProperty } from '@stencil/core/internal';

export type TypeFactory<type> = (metadata: TypeMetadata) => type;

export type TypeMetadata =
  | ComponentPropertyMetadata
  | ObjectFieldMetadata
  | UnionMemberMetadata;

export type ComponentPropertyMetadata = {
  kind: 'component-property';
  propMeta: ComponentCompilerProperty;
};

export type ObjectFieldMetadata = {
  kind: 'object-field';
  name: string;
  type: string;
};

export type UnionMemberMetadata = {
  kind: 'union-member';
  name: string;
  type: string;
};
