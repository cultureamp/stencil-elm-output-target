/**
 * A really dumb parser that finds members of a TypeScript union type and
 * reports their types as strings.
 *
 * E.g. "boolean | string[] | { foo: string; }" => ["boolean", "string[]", "{ foo: string; }"]
 *
 * Please make Kev write a test suite for this so that it is maintainable.
 */
type ParserState =
  | 'start'
  | 'beforeMember'
  | 'beforeObjectMember'
  | 'beforePrimitiveMember'
  | 'afterMember'
  | 'beforeDelimiter'
  | 'done';

export default function parser(resolvedType: string) {
  let parsePosition = 0;
  let parserState: ParserState = 'start';
  let members: { type: string }[] = [];
  let delimitedValue = '';
  let delimiterNestingLevel = 0;

  return {
    parse() {
      while (parserState !== 'done') {
        switch (parserState) {
          case 'start':
          case 'beforeMember':
            this.branch('{ ', 'beforeObjectMember', 'beforePrimitiveMember');
            break;

          case 'beforeObjectMember':
            this.delimitedString(
              '{',
              '}',
              (objectType) => {
                members.push({
                  type: objectType.slice(0),
                });
              },
              `a union member object type`,
              'afterMember',
            );
            break;

          case 'beforePrimitiveMember':
            this.expect(
              {
                regExp: /^([^|]+)(?= \| |$)/,
                capture: (type) => {
                  members.push({ type });
                },
              },
              'a primitive member type',
              'afterMember',
            );
            break;

          case 'afterMember':
            this.branch(/^$/, 'done', 'beforeDelimiter');
            break;

          case 'beforeDelimiter':
            this.expect(
              ' | ',
              'a "|" delimiter between union members',
              'beforeMember',
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
    members() {
      return members;
    },
  }.parse();
}
