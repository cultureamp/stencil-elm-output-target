import { AnyObjectType } from '../any-object-type';
import { FixedObjectType } from '../fixed-object-type';
import { Type } from '../type';
import { TypeMetadata } from '../types';

describe('FixedObjectType', () => {
  it('should accept a minimal object type', () => {
    const metadata = { name: 'foo', type: '{ }' };
    const type = new FixedObjectType(metadata, typeFactory);
    expect(type.isCompatibleWithMetadata()).toBe(true);
  });

  describe('for an object with a required field', () => {
    const metadata = { name: 'foo', type: '{ foo: string; }' };

    it('is compatible with metadata', () => {
      const type = new FixedObjectType(metadata, typeFactory);
      expect(type.isCompatibleWithMetadata()).toBe(true);
    });

    it('generates a named type alias', () => {
      const type = new FixedObjectType(metadata, typeFactory);
      expect(type.annotation()).toEqual('Foo');
      expect(type.typeAliasNames()).toEqual(['Foo']);
      expect(type.typeAliasDeclarations()).toEqual(
        expect.arrayContaining([expect.stringMatching(/^type alias Foo =/)]),
      );
    });

    it('maps the field to a required JSON value', () => {
      const type = new FixedObjectType(metadata, typeFactory);
      expect(type.typeAliasDeclarations()[0]).toMatch('foo : Value');
      expect(type.encoders()[0]).toMatch(
        'foo.foo |> (\\value -> Just ( "foo", identity value ))',
      );
    });

    it('generates no custom types', () => {
      const type = new FixedObjectType(metadata, typeFactory);
      expect(type.customTypeNames()).toEqual([]);
      expect(type.customTypeDeclarations()).toEqual([]);
    });

    it('generates code to encode Elm values to JSON objects', () => {
      const type = new FixedObjectType(metadata, typeFactory);
      expect(type.isSettableAsElementAttribute()).toBe(false);
      expect(type.attributeEncoderName()).toEqual('fooEncoder');
      expect(type.jsonEncoderName()).toEqual('fooEncoder');
      expect(type.encoders()[0]).toMatch(/^fooEncoder : Foo -> Value$/m);
    });
  });

  describe('for an object with an optional field', () => {
    const metadata = { name: 'foo', type: '{ foo?: string; }' };

    it('maps the field to a Maybe JSON value', () => {
      const type = new FixedObjectType(metadata, typeFactory);
      expect(type.typeAliasDeclarations()[0]).toMatch('foo : Maybe Value');
      expect(type.encoders()[0]).toMatch(
        'foo.foo |> Maybe.map (\\value -> ( "foo", identity value ))',
      );
    });
  });

  const typeFactory = (metadata: TypeMetadata): Type =>
    new AnyObjectType(metadata, typeFactory);
});
