import { AnyObjectType } from './any-object-type';
import { BooleanType } from './boolean-type';
import { EnumeratedStringType } from './enumerated-string-type';
import { FixedObjectType } from './fixed-object-type';
import { NumberType } from './number-type';
import { StringType } from './string-type';
import { ConcreteTypeClass, Type } from './type';
import { TypeFactory, TypeMetadata } from './types';
import { UnionType } from './union-type';
import { UnsupportedType } from './unsupported-type';

export function propTypeFromMetadata(metadata: TypeMetadata): Type {
  const typeStrings: string[] =
    metadata.kind === 'component-property'
      ? [
          metadata.propMeta.complexType.original,
          metadata.propMeta.complexType.resolved,
        ]
      : [metadata.type];

  return propTypeForType(typeStrings, metadata, propTypeFromMetadata);
}

function propTypeForType(
  typeStrings: string[],
  metadata: TypeMetadata,
  typeFactory: TypeFactory<Type>,
): Type {
  // get possibly-compatible Types based on regex match of the type string
  const candidatePropTypes: Type[] = propTypeClassByType.reduce(
    (candidateProps, { ifTypeMatches, thenTypeClass }) =>
      typeStrings.some(ifTypeMatches.test.bind(ifTypeMatches))
        ? [...candidateProps, new thenTypeClass(metadata, typeFactory)]
        : candidateProps,
    [] as Type[],
  );

  return (
    candidatePropTypes.find((type) => type.isSupported()) ||
    new UnsupportedType(metadata, typeFactory)
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
  {
    ifTypeMatches: /^(undefined \| )?(.+ \| )+[^\|]+$/, // supportedType1 | supportedType2
    thenTypeClass: UnionType,
  },
];
