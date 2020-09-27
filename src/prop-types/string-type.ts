import { Type } from './type';

export class StringType extends Type {
  isCompatibleWithMetadata(): boolean {
    return this.typeString === 'string';
  }

  annotation(): string {
    return 'String';
  }

  customTypeNames(): string[] {
    return [];
  }

  customTypeDeclarations(): string[] {
    return [];
  }

  attributeEncoderName(): null {
    return null;
  }

  jsonEncoderName(): string {
    return 'Encode.string';
  }

  encoders(): string[] {
    return [];
  }

  typeAliasNames(): string[] {
    return [];
  }

  typeAliasDeclarations(): string[] {
    return [];
  }

  isSettableAsElementAttribute(): boolean {
    return true;
  }
}
