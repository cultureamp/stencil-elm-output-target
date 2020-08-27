export class Prop {
  tagName: string;
  name: string;
  type: string;
  required: boolean;

  constructor(
    cmpMeta: { tagName: string },
    prop: { name: string; type: string; required: boolean },
  ) {
    this.tagName = cmpMeta.tagName;
    this.name = prop.name;
    this.type = prop.type;
    this.required = prop.required;
  }

  isSupported(): boolean {
    throw new Error('not implemented');
  }

  customTypeDeclaration(): string | null {
    throw new Error('not implemented');
  }

  customTypeEncoder(): string | null {
    throw new Error('not implemented');
  }

  customTypeName(): string | null {
    throw new Error('not implemented');
  }

  configFieldTypeAnnotation(): string {
    return `${this.attributeName()} : ${this.configArgTypeAnnotation()}`;
  }

  attributeName(): string {
    return this.name;
  }

  configArgTypeAnnotation(): string {
    throw new Error('not implemented');
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    throw new Error('not implemented');
  }
}
