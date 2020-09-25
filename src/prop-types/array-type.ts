import { Type } from './type';
import { TypeFactory, TypeMetadata } from './types';

export class ArrayType extends Type {
  name: string;
  typeString: string;
  itemType: Type;

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    switch (metadata.kind) {
      case 'component-property':
        this.name = metadata.propMeta.name;
        this.typeString = metadata.propMeta.complexType.resolved;
        break;

      case 'object-field':
      case 'union-member':
        this.name = metadata.name;
        this.typeString = metadata.type;
        break;
    }

    const itemTypeString = this.typeString
      // strip "undefined | " from the start of the type of an optional prop
      .replace(/^undefined \| /, '')
      // strip " | undefined" from the end of the type of an optional prop
      .replace(/ \| undefined$/, '')
      // strip [] off the end of the type
      .replace(/\[\]$/, '');

    this.itemType = typeFactory({
      kind: 'object-field',
      name: `${this.name}Item`,
      type: itemTypeString,
    });
  }

  isSupported(): boolean {
    return this.itemType.isSupported();
  }

  annotation(): string {
    return `List ${this.itemType.annotation()}`;
  }

  customTypeNames(): string[] {
    return this.itemType.customTypeNames();
  }

  customTypeDeclarations(): string[] {
    return this.itemType.customTypeDeclarations();
  }

  attributeEncoderName(): string {
    return `Encode.list ${this.itemType.jsonEncoderName()}`;
  }

  jsonEncoderName(): string {
    return this.attributeEncoderName();
  }

  encoders(): string[] {
    return this.itemType.encoders();
  }

  typeAliasNames(): string[] {
    return this.itemType.typeAliasNames();
  }

  typeAliasDeclarations(): string[] {
    return this.itemType.typeAliasDeclarations();
  }

  isSettableAsElementAttribute(): boolean {
    return false;
  }
}
