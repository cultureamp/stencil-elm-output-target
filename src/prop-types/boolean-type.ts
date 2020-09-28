import { Type } from './type';

export class BooleanType extends Type {
  isCompatibleWithMetadata(): boolean {
    return this.typeString === 'boolean';
  }

  annotation(): string {
    return 'Bool';
  }

  customTypeNames(): string[] {
    return [];
  }

  customTypeDeclarations(): string[] {
    return [];
  }

  attributeEncoderName(): string {
    return 'boolToString';
  }

  jsonEncoderName(): string {
    return 'Encode.bool';
  }

  encoders(): string[] {
    return [
      [
        `boolToString : Bool -> String`,
        `boolToString bool =`,
        `    if bool then "true" else "false"`,
      ].join('\n'),
    ];
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
