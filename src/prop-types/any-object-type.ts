import { Type } from './type';

export class AnyObjectType extends Type {
  isSupported(): boolean {
    return true;
  }

  annotation(): string {
    return 'Value';
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

  jsonEncoderName(): null {
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
    return false;
  }
}
