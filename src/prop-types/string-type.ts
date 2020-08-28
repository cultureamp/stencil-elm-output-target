import { Type } from './type';

export class StringType extends Type {
  isSupported(): boolean {
    return true;
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
