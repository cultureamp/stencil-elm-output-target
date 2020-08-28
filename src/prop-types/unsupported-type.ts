import { Type } from './type';
import { TypeFactory, TypeMetadata } from './types';

export class UnsupportedType extends Type {
  metadata: TypeMetadata;

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    // Store for inspection in a debugger if necessary
    this.metadata = metadata;
  }

  isSupported(): boolean {
    return false;
  }

  annotation(): string {
    throw new Error('Method not implemented.');
  }
  customTypeNames(): string[] {
    throw new Error('Method not implemented.');
  }
  customTypeDeclarations(): string[] {
    throw new Error('Method not implemented.');
  }
  typeAliasNames(): string[] {
    throw new Error('Method not implemented.');
  }
  typeAliasDeclarations(): string[] {
    throw new Error('Method not implemented.');
  }
  attributeEncoderName(): string | null {
    throw new Error('Method not implemented.');
  }
  encoders(): string[] {
    throw new Error('Method not implemented.');
  }
  isSettableAsElementAttribute(): boolean {
    throw new Error('Method not implemented.');
  }
}
