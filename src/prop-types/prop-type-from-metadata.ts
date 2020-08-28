import {
  ComponentCompilerMeta,
  ComponentCompilerProperty,
} from '@stencil/core/internal';
import { AnyObjectType } from './any-object-type';
import { BooleanType } from './boolean-type';
import { EnumeratedStringType } from './enumerated-string-type';
import { FixedObjectType } from './fixed-object-type';
import { StringType } from './string-type';
import { Type } from './type';
import { UnsupportedType } from './unsupported-type';

export function propTypeFromMetadata(
  cmpMeta: ComponentCompilerMeta,
  propMeta: ComponentCompilerProperty,
  nestedType?: { original: string; resolved: string },
): Type {
  const complexType = nestedType || propMeta.complexType;

  return new (propTypeClassForType(complexType))(
    cmpMeta,
    propMeta,
    propTypeFromMetadata,
    complexType,
  );
}

function propTypeClassForType(complexType: {
  original: string;
  resolved: string;
}): typeof Type {
  return (
    propTypeClassByType.find(
      ({ ifTypeMatches }) =>
        ifTypeMatches.test(complexType.original) ||
        ifTypeMatches.test(complexType.resolved),
    )?.thenTypeClass || UnsupportedType
  );
}

const propTypeClassByType: {
  ifTypeMatches: RegExp;
  thenTypeClass: typeof Type;
}[] = [
  { ifTypeMatches: /^boolean$/, thenTypeClass: BooleanType },
  { ifTypeMatches: /^string$/, thenTypeClass: StringType },
  { ifTypeMatches: /^object$/, thenTypeClass: AnyObjectType },
  {
    ifTypeMatches: /^("[^"]*" \| )*"[^"]*"$/, // '"foo" | "bar" | "baz"'
    thenTypeClass: EnumeratedStringType,
  },
  {
    ifTypeMatches: /^(undefined \| )?{ (\w+: .+; )+}$/, // { key1: type1; key2: type2; }
    thenTypeClass: FixedObjectType,
  },
];
