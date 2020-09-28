import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
  Logger,
} from '@stencil/core/internal';
import { AnyObjectType } from './any-object-type';
import { ArrayType } from './array-type';
import { BooleanType } from './boolean-type';
import { EnumeratedStringType } from './enumerated-string-type';
import { FixedObjectType } from './fixed-object-type';
import { NumberType } from './number-type';
import { StringType } from './string-type';
import { ConcreteTypeClass, Type } from './type';
import { TypeMetadata } from './types';
import { UnionType } from './union-type';

export function forComponentProperty(
  config: { logger?: Logger },
  cmpMeta: ComponentCompilerMeta,
  propMeta: ComponentCompilerProperty,
): Type {
  const typeFactory = (metadata: TypeMetadata): Type => {
    // find the first type class that claims to be compatible with metadata
    let instance: Type | undefined;
    const firstCompatibleType = typeClasses.find((typeClass) =>
      (instance = new typeClass(
        metadata,
        typeFactory,
      )).isCompatibleWithMetadata(),
    );
    if (firstCompatibleType && instance) return instance;

    config.logger?.warn(
      collapseWhitespace(`Component "${cmpMeta.tagName}" prop "${propMeta.name}"
      of type ${propMeta.complexType.original} contains type ${metadata.type}
      that is not supported by the Elm output target. It will be exposed to Elm
      as a generic JSON value (Json.Encode.Value) with no guarantee that the
      value provided by the Elm program is of the type expected by the
      component.`),
    );
    return new AnyObjectType(metadata, typeFactory);
  };

  return typeFactory({
    name: propMeta.name,
    type: propMeta.complexType.resolved,
  });
}

/**
 * Available classses for generating Elm code for TypeScript types.
 * These are listed in order of descending specificity. If more than one of
 * these reports `instance.isCompatibleWtihMetadata() === true`, then use the
 * first one as it will be the best match.
 */
const typeClasses: ConcreteTypeClass[] = [
  BooleanType,
  NumberType,
  StringType,
  EnumeratedStringType,
  UnionType,
  FixedObjectType,
  ArrayType,
];

function collapseWhitespace(multiLineString: string): string {
  return multiLineString.replace(/\s+/, ' ');
}

export { Type } from './type';
