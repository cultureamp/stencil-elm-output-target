import { TypeMetadata, TypeFactory } from './types';

export type ConcreteTypeClass = {
  new (metadata: TypeMetadata, typeFactory: TypeFactory<Type>): Type;
};

/**
 * Generates Elm code fragments for a TypeScript type in a Stencil component
 */
export abstract class Type {
  protected name: string;
  protected typeString: string;

  constructor(
    metadata: TypeMetadata,
    protected typeFactory: TypeFactory<Type>,
  ) {
    this.name = metadata.name;
    this.typeString = metadata.type;
  }

  /**
   * Reports whether the type metadata provided to the constructor was in the
   * expected format.
   *
   * Consumers should check this before using the object, as other methods may
   * return invalid or undefined results if this is `false`.
   */
  abstract isCompatibleWithMetadata(): boolean;

  abstract annotation(): string;

  abstract customTypeNames(): string[];

  abstract customTypeDeclarations(): string[];

  abstract typeAliasNames(): string[];

  abstract typeAliasDeclarations(): string[];

  abstract attributeEncoderName(): string | null;

  abstract jsonEncoderName(): string | null;

  abstract encoders(): string[];

  abstract isSettableAsElementAttribute(): boolean;
}
