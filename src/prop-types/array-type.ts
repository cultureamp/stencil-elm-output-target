import { Type } from './type';
import { TypeFactory, TypeMetadata } from './types';

export class ArrayType extends Type {
  itemType: Type | undefined;

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    const match = this.typeString
      // strip "undefined | " from the start of the type of an optional prop
      .replace(/^undefined \| /g, '')
      // strip " | undefined" from the end of the type of an optional prop
      .replace(/ \| undefined$/g, '')
      // this is a bit loose, since it can match "a | b[]", so be sure to
      // prefer union type if it also claims to be compatible
      .match(/(?<itemType>.*)\[\]$/);
    if (match?.groups)
      this.itemType = typeFactory({
        name: `${this.name}ListItem`,
        type: match.groups.itemType,
      });
  }

  isCompatibleWithMetadata(): boolean {
    return this.itemType !== undefined;
  }

  annotation(): string {
    return `(List ${this.itemType?.annotation()})`;
  }

  customTypeNames(): string[] {
    return this.itemType?.customTypeNames() || [];
  }

  customTypeDeclarations(): string[] {
    return this.itemType?.customTypeDeclarations() || [];
  }

  attributeEncoderName(): string {
    return `Encode.list ${this.itemType?.jsonEncoderName() || ''}`;
  }

  jsonEncoderName(): string {
    return this.attributeEncoderName();
  }

  encoders(): string[] {
    return this.itemType?.encoders() || [];
  }

  typeAliasNames(): string[] {
    return this.itemType?.typeAliasNames() || [];
  }

  typeAliasDeclarations(): string[] {
    return this.itemType?.typeAliasDeclarations() || [];
  }

  isSettableAsElementAttribute(): boolean {
    return false;
  }
}
