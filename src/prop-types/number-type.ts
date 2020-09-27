import { Type } from './type';

export class NumberType extends Type {
  isCompatibleWithMetadata(): boolean {
    return this.typeString === 'number';
  }

  annotation(): string {
    // Assuming for now that all number props take only integers. If we need to
    // support floating point values for a prop in the future, consider changing
    // this to Float, or using some prop naming convention to distinguish
    // between Int and Float props (TypeScript does not draw a distinction).
    return 'Int';
  }

  customTypeNames(): string[] {
    return [];
  }

  customTypeDeclarations(): string[] {
    return [];
  }

  attributeEncoderName(): string {
    return 'String.fromInt';
  }

  jsonEncoderName(): string {
    return 'Encode.int';
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
