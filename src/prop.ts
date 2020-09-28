import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
  Logger,
} from '@stencil/core/internal';
import { forComponentProperty, Type } from './prop-types';

export class Prop {
  propMeta: ComponentCompilerProperty;
  propType: Type;

  constructor(
    config: { logger?: Logger },
    cmpMeta: ComponentCompilerMeta,
    propMeta: ComponentCompilerProperty,
  ) {
    this.propMeta = propMeta;
    this.propType = forComponentProperty(config, cmpMeta, propMeta);
  }

  isSupported(): boolean {
    return this.propType.isCompatibleWithMetadata();
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    const attributeFunction = this.propType.isSettableAsElementAttribute()
      ? 'attribute'
      : 'property';

    const encoder = this.propType.attributeEncoderName();

    const attribute = (!isOnly ? 'props.' : '') + this.propName();

    return this.propMeta.required
      ? [
          `${attribute} |> `,
          `${encoder ? `${encoder} |> ` : ''}`,
          `${attributeFunction} "${this.attributeName()}" |> Just`,
        ].join('')
      : [
          `${attribute} |> `,
          `Maybe.map (`,
          `${encoder ? `${encoder} >> ` : ''}`,
          `${attributeFunction} "${this.attributeName()}"`,
          `)`,
        ].join('');
  }

  fieldTypeAnnotation(): string {
    return `${this.propName()} : ${this.argTypeAnnotation()}`;
  }

  propName(): string {
    return this.propMeta.name;
  }

  attributeName(): string {
    // this.propMeta.attribute is undefined when prop is not
    // representable as an HTML attribute e.g. analytics object
    return this.propMeta.attribute || this.propMeta.name;
  }

  argTypeAnnotation(): string {
    return `${
      !this.propMeta.required ? 'Maybe ' : ''
    }${this.propType.annotation()}`;
  }

  customTypeNames(): string[] {
    return this.propType.customTypeNames();
  }

  customTypeDeclarations(): string[] {
    return this.propType.customTypeDeclarations();
  }

  typeAliasNames(): string[] {
    return this.propType.typeAliasNames();
  }

  typeAliasDeclarations(): string[] {
    return this.propType.typeAliasDeclarations();
  }

  encoders(): string[] {
    return this.propType.encoders();
  }
}
