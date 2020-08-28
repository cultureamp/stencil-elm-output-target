import { TypeMetadata, TypeFactory } from './types';

export type ConcreteTypeClass = {
  new (metadata: TypeMetadata, typeFactory: TypeFactory<Type>): Type;
};

export abstract class Type {
  constructor(
    protected metadata: TypeMetadata,
    protected typeFactory: TypeFactory<Type>,
  ) {}

  abstract isSupported(): boolean;

  abstract annotation(): string;

  abstract customTypeNames(): string[];

  abstract customTypeDeclarations(): string[];

  abstract typeAliasNames(): string[];

  abstract typeAliasDeclarations(): string[];

  abstract attributeEncoderName(): string | null;

  abstract encoders(): string[];

  abstract isSettableAsElementAttribute(): boolean;
}
