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
    expect(parsedFields).toEqual([
      { name: 'foo', type: 'string', required: true },
    ]);
  });

  it('should parse an object with an optional field', () => {
    const typeString = '{ foo?: string; }';
    const parsedFields = parser(typeString).fields();
    expect(parsedFields).toEqual([
      { name: 'foo', type: 'string', required: false },
    ]);
  });

  it('should parse an object with a nested object field', () => {
    const typeString = '{ foo: { bar: string; }; }';
    const parsedFields = parser(typeString).fields();
    expect(parsedFields).toEqual([
      { name: 'foo', type: '{ bar: string; }', required: true },
    ]);
  });

  it('should parse an object with an optional nested object field', () => {
    const typeString = '{ foo?: { bar: string; }; }';
    const parsedFields = parser(typeString).fields();
    expect(parsedFields).toEqual([
      { name: 'foo', type: '{ bar: string; }', required: false },
    ]);
  });
});
