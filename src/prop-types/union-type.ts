import parser from './union-type/parser';
import { capitalize } from '../utils';
import { Type } from './type';
import { TypeFactory, TypeMetadata } from './types';

type Member = { name: string; type: Type };

export class UnionType extends Type {
  members: Member[];
  memberParserError?: Error;

  constructor(metadata: TypeMetadata, typeFactory: TypeFactory<Type>) {
    super(metadata, typeFactory);

    try {
      const memberStrings = parser(this.typeString)
        .members()
        // ignore 'undefined' members, which just signify the value is optional
        .filter(({ type }) => type !== 'undefined');
      if (memberStrings.length < 2)
        // Accepting unions of just one type would cause infinite recursion, as
        // we tried to determine the type of a union with a single member with a
        // type of a union with a single member with a type of a union with a
        // single member...
        throw new Error(
          'Not a union type, since it does not have at least two non-undefined members!',
        );

      this.members = memberStrings.map(
        ({ type }: { type: string }, index: number) => ({
          name: this.memberConstructorName(index),
          type: typeFactory({
            name: this.memberValueTypeAliasName(index),
            type,
          }),
        }),
      );
    } catch (parserError) {
      this.members = [];
      this.memberParserError = parserError;
    }
  }

  private memberConstructorName(memberIndex: number): string {
    // Could parse and use names from complexType.original to generate
    // nicer constructor function names and type aliases
    return `${this.name}${memberIndex}`;
  }

  private memberValueTypeAliasName(memberIndex: number): string {
    return `${this.name}${memberIndex}Value`;
  }

  isCompatibleWithMetadata(): boolean {
    return (
      !this.memberParserError &&
      this.members.every(({ type }) => type.isCompatibleWithMetadata())
    );
  }

  annotation(): string {
    return this.customTypeName();
  }

  customTypeNames(): string[] {
    return [
      this.customTypeName(),
      ...this.members.flatMap(({ type }) => type.customTypeNames()),
    ];
  }

  private customTypeName(): string {
    return capitalize(this.name);
  }

  customTypeDeclarations(): string[] {
    return [
      this.customTypeDeclaration(),
      ...this.members.flatMap(({ type }) => type.customTypeDeclarations()),
    ];
  }

  private customTypeDeclaration(): string {
    return [
      `type ${this.customTypeName()}`,
      `    = ${this.customTypeConstructors().join('\n    | ')}`,
    ].join('\n');
  }

  private customTypeConstructors(): string[] {
    return this.members.map(
      ({ name, type }) => `${capitalize(name)} ${type.annotation()}`,
    );
  }

  attributeEncoderName(): string {
    return `${this.name}Encoder`;
  }

  jsonEncoderName(): string {
    return this.attributeEncoderName();
  }

  encoders(): string[] {
    return [
      [
        [
          `${this.name}Encoder : ${this.customTypeName()} -> Value`,
          `${this.name}Encoder ${this.name} =`,
          `    case ${this.name} of`,
        ],
        this.members.map(({ name, type }) =>
          [
            `        ${capitalize(name)} value ->`,
            `            ${type.jsonEncoderName()} value`,
          ].join('\n'),
        ),
      ]
        .flat()
        .join('\n'),
      ...this.members.flatMap(({ type }) => type.encoders()),
    ];
  }

  typeAliasNames(): string[] {
    return this.members.flatMap(({ type }) => type.typeAliasNames());
  }

  typeAliasDeclarations(): string[] {
    return this.members.flatMap(({ type }) => type.typeAliasDeclarations());
  }

  isSettableAsElementAttribute(): boolean {
    return false;
  }
}
