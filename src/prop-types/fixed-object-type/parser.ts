/**
 * A really dumb parser that finds fields of a TypeScript object type and
 * reports their types as strings.
 *
 * E.g. "{ foo: string; bar: { baz: object; }; }"
 */
type ParserState =
  | 'start'
  | 'beforeField'
  | 'beforeFieldName'
  | 'beforeFieldType'
  | 'beforeObjectType'
  | 'beforePrimitiveType'
  | 'end'
  | 'done';

export default function parser(resolvedType: string) {
  let parsePosition = 0;
  let parserState: ParserState = 'start';
  let fields: { name: string; type: string }[] = [];
  let nextFieldName: string;
  let delimitedValue = '';
  let delimiterNestingLevel = 0;

  return {
    parse() {
      while (parserState !== 'done') {
        switch (parserState) {
          case 'start':
            this.expect(
              '{ ',
              'an opening brace for the start of the object type',
              'beforeField',
            );
            break;

          case 'beforeField':
            this.branch('}', 'end', 'beforeFieldName');
            break;

          case 'beforeFieldName':
            this.expect(
              {
                regExp: /^(\w+): /,
                capture: (fieldName) => {
                  nextFieldName = fieldName;
                },
              },
              'a field name in the object type',
              'beforeFieldType',
            );
            break;

          case 'beforeFieldType':
            this.branch('{ ', 'beforeObjectType', 'beforePrimitiveType');
            break;

          case 'beforeObjectType':
            this.delimitedString(
              '{',
              '}; ',
              (objectTypeWithSemicolonSpace) => {
                fields.push({
                  name: nextFieldName,
                  type: objectTypeWithSemicolonSpace.slice(0, -'; '.length),
                });
              },
              `a nested object type for the ${nextFieldName} field`,
              'beforeField',
            );
            break;

          case 'beforePrimitiveType':
            this.expect(
              {
                regExp: /^([^;]+); /,
                capture: (fieldType) => {
                  fields.push({ name: nextFieldName, type: fieldType });
                },
              },
              `a primitive type for the ${nextFieldName} field`,
              'beforeField',
            );
            break;

          case 'end':
            this.expect(
              { regExp: /^}$/ },
              'the end of the type string',
              'done',
            );
            break;
        }
      }
      return this;
    },
    expect(
      expected: string | { regExp: RegExp; capture?: (value: string) => void },
      expectedMsg: string,
      nextState: ParserState,
    ) {
      if (typeof expected === 'string') {
        if (resolvedType.substring(parsePosition).startsWith(expected)) {
          parsePosition += expected.length;
        } else {
          throw new Error(`Expected ${expectedMsg}`);
        }
      } else {
        const matches = resolvedType
          .substring(parsePosition)
          .match(expected.regExp);
        if (matches && !(expected.capture && !matches[1])) {
          if (expected.capture) {
            expected.capture(matches[1]);
          }
          parsePosition += matches[0].length;
        } else {
          throw new Error(
            `Expected ${expectedMsg}. Found instead: ${resolvedType.substring(
              parsePosition,
            )}`,
          );
        }
      }
      parserState = nextState;
    },
    branch(
      match: string | RegExp,
      nextStateIf: ParserState,
      nextStateElse: ParserState,
    ) {
      parserState = (
        typeof match === 'string'
          ? resolvedType.substring(parsePosition).startsWith(match)
          : resolvedType.substring(parsePosition).match(match)
      )
        ? nextStateIf
        : nextStateElse;
    },
    delimitedString(
      startDelimiter: string,
      endDelimiter: string,
      capture: (value: string) => void,
      expectedMsg: string,
      nextState: ParserState,
    ) {
      const nextStart = resolvedType.indexOf(startDelimiter, parsePosition);
      const nextEnd = resolvedType.indexOf(endDelimiter, parsePosition);

      if (delimiterNestingLevel === 0) {
        delimitedValue = '';
      }

      // if a start delimiter is next, increase nesting level
      if (nextStart >= 0 && nextStart < nextEnd) {
        const nextParsePosition = nextStart + startDelimiter.length;
        delimitedValue += resolvedType.slice(parsePosition, nextParsePosition);
        delimiterNestingLevel++;
        parsePosition = nextParsePosition;
      }
      // if an end delimiter is next, decrease nesting level
      else if (nextStart < 0 || nextEnd < nextStart) {
        const nextParsePosition = nextEnd + endDelimiter.length;
        delimitedValue += resolvedType.slice(parsePosition, nextParsePosition);
        delimiterNestingLevel--;
        parsePosition = nextParsePosition;

        if (delimiterNestingLevel === 0) {
          capture(delimitedValue);
          parserState = nextState;
          return;
        }
      }

      if (nextEnd < 0 || delimiterNestingLevel <= 0) {
        throw new Error(`Expected ${expectedMsg}`);
      }
    },
    fields() {
      return fields;
    },
  }.parse();
}
