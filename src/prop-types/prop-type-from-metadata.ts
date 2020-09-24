import { AnyObjectType } from './any-object-type';
import { BooleanType } from './boolean-type';
import { EnumeratedStringType } from './enumerated-string-type';
import { FixedObjectType } from './fixed-object-type';
import { NumberType } from './number-type';
import { StringType } from './string-type';
import { ConcreteTypeClass, Type } from './type';
import { TypeMetadata } from './types';
import { UnsupportedType } from './unsupported-type';

export function propTypeFromMetadata(metadata: TypeMetadata): Type {
  const typeStrings: string[] =
    metadata.kind === 'component-property'
      ? [
          metadata.propMeta.complexType.original,
          metadata.propMeta.complexType.resolved,
        ]
      : [metadata.type];

  return new (propTypeClassForType(typeStrings))(
    metadata,
    propTypeFromMetadata,
  );
}

function propTypeClassForType(typeStrings: string[]): ConcreteTypeClass {
  return (
    propTypeClassByType.find(({ ifTypeMatches }) =>
      typeStrings.some((typeString) => ifTypeMatches.test(typeString)),
    )?.thenTypeClass || UnsupportedType
  );
}

const propTypeClassByType: {
  ifTypeMatches: RegExp;
  thenTypeClass: ConcreteTypeClass;
}[] = [
  { ifTypeMatches: /^boolean$/, thenTypeClass: BooleanType },
  { ifTypeMatches: /^number$/, thenTypeClass: NumberType },
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
