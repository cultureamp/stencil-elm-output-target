import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
  Config,
} from '@stencil/core/internal';
import { AnyObjectProp } from './any-object-prop';
import { EnumeratedStringProp } from './enumerated-string-prop';
import { FixedObjectProp } from './fixed-object-prop';
import { Prop } from './prop';
import { StringProp } from './string-prop';
import { UnsupportedProp } from './unsupported-prop';
import { BooleanProp } from './boolean-prop';

export function propFromMetadata(
  config: Config,
  cmpMeta: ComponentCompilerMeta,
  propMeta: ComponentCompilerProperty,
): Prop {
  const propClassByType: {
    ifTypeMatches: RegExp;
    thenPropClass: typeof Prop;
  }[] = [
    { ifTypeMatches: /^boolean$/, thenPropClass: BooleanProp },
    { ifTypeMatches: /^string$/, thenPropClass: StringProp },
    { ifTypeMatches: /^object$/, thenPropClass: AnyObjectProp },
    {
      ifTypeMatches: /^("[^"]*" \| )*"[^"]*"$/, // '"foo" | "bar" | "baz"'
      thenPropClass: EnumeratedStringProp,
    },
    {
      ifTypeMatches: /^(undefined \| ){ (\w+: .+; )+}?$/, // { key1: type1, key2: type2 }
      thenPropClass: FixedObjectProp,
    },
  ];

  const propClass =
    propClassByType.find(
      ({ ifTypeMatches }) =>
        ifTypeMatches.test(propMeta.complexType.original) ||
        ifTypeMatches.test(propMeta.complexType.resolved),
    )?.thenPropClass || UnsupportedProp;

  const prop = new propClass(cmpMeta, propMeta);

  if (!prop.isSupported()) {
    config.logger?.warn(
      `Component "${cmpMeta.tagName}" prop "${propMeta.name}" of type ${propMeta.complexType.original} is not supported by Elm output target.`,
    );
  }

  return prop;
}

export { AnyObjectProp } from './any-object-prop';
export { EnumeratedStringProp } from './enumerated-string-prop';
export { FixedObjectProp } from './fixed-object-prop';
export { Prop } from './prop';
export { StringProp } from './string-prop';
export { UnsupportedProp } from './unsupported-prop';
export { BooleanProp } from './boolean-prop';
