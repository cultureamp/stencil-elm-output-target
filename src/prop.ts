import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
  Logger,
} from '@stencil/core/internal';
import { propTypeFromMetadata, Type } from './prop-types';

export class Prop {
  propMeta: ComponentCompilerProperty;
  propType: Type;

  constructor(
    config: { logger?: Logger },
    cmpMeta: ComponentCompilerMeta,
    propMeta: ComponentCompilerProperty,
  ) {
    this.propMeta = propMeta;
    this.propType = propTypeFromMetadata(cmpMeta, propMeta);

    if (!this.propType.isSupported()) {
      config.logger?.warn(
        `Component "${cmpMeta.tagName}" prop "${propMeta.name}" of type ${propMeta.complexType.original} is not supported by Elm output target.`,
      );
    }
  }

  isSupported(): boolean {
    return this.propType.isSupported();
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    const attributeFunction = this.propType.isSettableAsElementAttribute()
      ? 'attribute'
      : 'property';

    const encoder = this.propType.attributeEncoderName();

    const attribute = (!isOnly ? 'attributes.' : '') + this.attributeName();

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
    return `${this.attributeName()} : ${this.argTypeAnnotation()}`;
  }

  attributeName(): string {
    return this.propMeta.name;
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
