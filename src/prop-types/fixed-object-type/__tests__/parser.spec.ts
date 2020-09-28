import parser from '../parser';

describe('parser', () => {
  it('should parse a minimal object type', () => {
    const typeString = '{ }';
    const parsedFields = parser(typeString).fields();
    expect(parsedFields).toEqual([]);
  });

  it('should parse an object with a primitive field', () => {
    const typeString = '{ foo: string; }';
    const parsedFields = parser(typeString).fields();
    expect(parsedFields).toEqual([{ name: 'foo', type: 'string' }]);
  });

  it('should parse an object with a nested object field', () => {
    const typeString = '{ foo: { bar: string; }; }';
    const parsedFields = parser(typeString).fields();
    expect(parsedFields).toEqual([{ name: 'foo', type: '{ bar: string; }' }]);
  });
});
