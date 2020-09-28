import { Type } from './type';

/**
 * Supports nonspecific `object` type,
 * as well as any type that we do not recognise,
 * giving the consuming Elm code the opportunity to encode the value itself
 * as a `Json.Encode.Value`.
 */
export class AnyObjectType extends Type {
  isCompatibleWithMetadata(): boolean {
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

  jsonEncoderName(): string {
    return 'identity';
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
