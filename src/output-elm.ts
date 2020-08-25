import path from 'path';
import { OutputTargetElm } from './types';
import { capitalize, dashToCamelCase, sortBy } from './utils';
import {
  CompilerCtx,
  ComponentCompilerMeta,
  Config,
  ComponentCompilerProperty,
  ComponentCompilerEvent,
} from '@stencil/core/internal';

export async function elmProxyOutput(
  compilerCtx: CompilerCtx,
  outputTarget: OutputTargetElm,
  components: ComponentCompilerMeta[],
  config: Config,
) {
  const filteredComponents = getFilteredComponents(
    outputTarget.excludeComponents,
    components,
  );

  await generateProxyElmModules(
    compilerCtx,
    config,
    filteredComponents,
    outputTarget,
  );
  // await copyResources(config, outputTarget);
}

function getFilteredComponents(
  excludeComponents: string[] = [],
  cmps: ComponentCompilerMeta[],
) {
  return sortBy(cmps, (cmp) => cmp.tagName).filter(
    (c) => !excludeComponents.includes(c.tagName) && !c.internal,
  );
}

async function generateProxyElmModules(
  this: void,
  compilerCtx: CompilerCtx,
  config: Config,
  components: ComponentCompilerMeta[],
  outputTarget: OutputTargetElm,
) {
  return Promise.all(
    components.map(
      generateProxyElmModule.bind(this, compilerCtx, config, outputTarget),
    ),
  );
}

async function generateProxyElmModule(
  this: void,
  compilerCtx: CompilerCtx,
  config: Config,
  outputTarget: OutputTargetElm,
  cmpMeta: ComponentCompilerMeta,
) {
  const moduleName = `${path.basename(
    outputTarget.proxiesModuleDir,
  )}.${capitalize(dashToCamelCase(cmpMeta.tagName))}`;

  const moduleDeclaration = `module ${moduleName} exposing
    ( ${componentExposures(config, cmpMeta).join('\n    , ')}\n    )\n`;

  const imports = `import Html exposing (Html, node)
import Html.Attributes exposing (attribute)
import Html.Events exposing (on)
import Json.Decode as Decode\n\n\n`;

  const codegenWarningComment =
    '-- AUTO-GENERATED PROXIES FOR CUSTOM ELEMENT\n\n';

  const generatedCode = componentElm(config, cmpMeta);

  const filePath: string = path.join(
    outputTarget.proxiesModuleDir,
    `${capitalize(dashToCamelCase(cmpMeta.tagName))}.elm`,
  );

  const moduleSrc: string = [
    moduleDeclaration,
    imports,
    codegenWarningComment,
    generatedCode,
  ].join('\n');

  return compilerCtx.fs.writeFile(filePath, moduleSrc);
}

function componentExposures(
  this: void,
  config: Config,
  cmpMeta: ComponentCompilerMeta,
): string[] {
  return [
    'view',
    ...[
      cmpMeta.properties.map(propFromMetadata.bind(this, config, cmpMeta)),
      cmpMeta.events.map(eventFromMetadata.bind(this, config, cmpMeta)),
    ]
      .flat()
      .filter((item) => item.isSupported())
      .map((item) => item.customTypeName())
      .filter((maybeNull) => maybeNull !== null)
      .map((item) => `${item}(..)`),
  ];
}

function componentElm(
  this: void,
  config: Config,
  cmpMeta: ComponentCompilerMeta,
): string {
  const configItems: (Prop | Event)[] = [
    cmpMeta.properties.map(propFromMetadata.bind(this, config, cmpMeta)),
    new StringProp(cmpMeta, { name: 'slot', type: 'string', required: false }),
    cmpMeta.events.map(eventFromMetadata.bind(this, config, cmpMeta)),
  ]
    .flat()
    .filter((item) => item.isSupported());

  const takesChildren: boolean = cmpMeta.htmlTagNames.includes('slot');

  const elementFunctionType: string = [
    (configItems.length === 1 && configItems[0].configArgTypeAnnotation()) ||
      (configItems.length > 1 &&
        '{ ' +
          configItems
            .map((item) => item.configFieldTypeAnnotation())
            .join('\n    , ') +
          '\n    }'),
    takesChildren && 'List (Html msg)',
    'Html msg',
  ]
    .filter((maybeFalsy) => !!maybeFalsy)
    .join('\n    -> ');

  const elementAttributesArg: string =
    (configItems.length === 1 && `${configItems[0].configArgName()} `) ||
    (configItems.length > 1 && 'attributes ') ||
    '';

  const attributes = [
    '([ ' +
      configItems
        .map((item) => item.maybeHtmlAttribute(configItems.length === 1))
        .join('\n         , '),
    '         ]',
    '            |> List.filterMap identity',
    '        )',
  ].join('\n');

  const elementChildrenArg: string = takesChildren ? 'children ' : '';

  const children = takesChildren ? 'children' : '[]';

  return [
    [
      `view :`,
      `    ${elementFunctionType}`,
      `view ${elementAttributesArg}${elementChildrenArg}=`,
      `    node "${cmpMeta.tagName}"`,
      `        ${attributes}`,
      `        ${children}`,
    ],
    configItems
      .map((item) => item.customTypeDeclaration())
      .filter((maybeNull) => maybeNull !== null),
    configItems
      .map((item) => item.customTypeEncoder())
      .filter((maybeNull) => maybeNull !== null),
  ]
    .filter((arr) => arr.length > 0)
    .map((arr) => arr.join('\n'))
    .join('\n\n\n');
}

function propFromMetadata(
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
    {
      ifTypeMatches: /^("[^"]*" \| )*"[^"]*"$/, // '"foo" | "bar" | "baz"'
      thenPropClass: EnumeratedStringProp,
    },
  ];

  const propClass =
    propClassByType.find(({ ifTypeMatches }) =>
      ifTypeMatches.test(propMeta.complexType.original),
    )?.thenPropClass || UnsupportedProp;

  const prop = new propClass(cmpMeta, propMeta);

  if (!prop.isSupported()) {
    config.logger?.warn(
      `Component "${cmpMeta.tagName}" prop "${propMeta.name}" of type ${propMeta.complexType.original} is not supported by Elm output target.`,
    );
  }

  return prop;
}

function eventFromMetadata(
  config: Config,
  cmpMeta: ComponentCompilerMeta,
  eventMeta: ComponentCompilerEvent,
): Event {
  const event = new Event(cmpMeta, eventMeta);

  if (!event.isSupported()) {
    config.logger?.warn(
      `Component "${cmpMeta.tagName}" event "${eventMeta.name}" is not supported by Elm output target.`,
    );
  }

  return event;
}

class Prop {
  tagName: string;
  name: string;
  type: string;
  required: boolean;

  constructor(
    cmpMeta: { tagName: string },
    prop: { name: string; type: string; required: boolean },
  ) {
    this.tagName = cmpMeta.tagName;
    this.name = prop.name;
    this.type = prop.type;
    this.required = prop.required;
  }

  isSupported(): boolean {
    throw new Error('not implemented');
  }

  customTypeDeclaration(): string | null {
    throw new Error('not implemented');
  }

  customTypeEncoder(): string | null {
    throw new Error('not implemented');
  }

  customTypeName(): string | null {
    throw new Error('not implemented');
  }

  configFieldTypeAnnotation(): string {
    return `${this.configArgName()} : ${this.configArgTypeAnnotation()}`;
  }

  configArgName(): string {
    return this.name;
  }

  configArgTypeAnnotation(): string {
    throw new Error('not implemented');
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    throw new Error('not implemented');
  }
}

class UnsupportedProp extends Prop {
  isSupported(): boolean {
    return false;
  }
}

class BooleanProp extends Prop {
  isSupported(): boolean {
    return true;
  }

  customTypeDeclaration(): null {
    return null;
  }

  customTypeEncoder(): null {
    return null;
  }

  customTypeName(): null {
    return null;
  }

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}Bool`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return (this.required
      ? [
          `Just (attribute "${this.name}"`,
          `            (if ${
            (!isOnly && 'attributes.') || ''
          }${this.configArgName()} then`,
          `                "true"`,
          ``,
          `             else`,
          `                "false"`,
          `            ))`,
        ]
      : [
          `Maybe.map`,
          `            (\\value ->`,
          `                attribute "${this.name}"`,
          `                    (if value then`,
          `                        "true"`,
          ``,
          `                     else`,
          `                        "false"`,
          `                    )`,
          `            )`,
          `            ${
            (!isOnly && 'attributes.') || ''
          }${this.configArgName()}`,
        ]
    ).join('\n');
  }
}

class StringProp extends Prop {
  isSupported(): boolean {
    return true;
  }

  customTypeDeclaration(): null {
    return null;
  }

  customTypeEncoder(): null {
    return null;
  }

  customTypeName(): null {
    return null;
  }

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}String`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return this.required
      ? `Just (attribute "${this.name}" ${
          (!isOnly && 'attributes.') || ''
        }${this.configArgName()})`
      : `Maybe.map (attribute "${this.name}") ${
          (!isOnly && 'attributes.') || ''
        }${this.configArgName()}`;
  }
}

class EnumeratedStringProp extends Prop {
  complexType: string; // '"foo" | "bar" | "baz"'

  constructor(cmpMeta: ComponentCompilerMeta, prop: ComponentCompilerProperty) {
    super(cmpMeta, prop);

    this.complexType = prop.complexType.original;
  }

  isSupported(): boolean {
    return true;
  }

  customTypeDeclaration(): string {
    return [
      `type ${this.customTypeName()}`,
      `    = ${this.customTypeConstructors().join('\n    | ')}`,
    ].join('\n');
  }

  customTypeEncoder(): string {
    return [
      [
        `${this.configArgName()}ToString : ${this.customTypeName()} -> String`,
        `${this.configArgName()}ToString ${this.configArgName()} =`,
        `    case ${this.configArgName()} of`,
      ],
      this.stringValues().map((value) =>
        [
          `        ${this.constructorForStringValue(value)} ->`,
          `            "${value}"\n`,
        ].join('\n'),
      ),
    ]
      .flat()
      .join('\n');
  }

  private customTypeConstructors() {
    return this.stringValues().map(this.constructorForStringValue, this);
  }

  private stringValues() {
    return this.complexType.split(' | ').map((str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(
            `Component "${this.tagName}" prop "${this.name}" value ${str} cannot be parsed as a JavaScript string.`,
          );
        }
        throw e;
      }
    });
  }

  private constructorForStringValue(str: string): string {
    if (str.match(/[a-z]+/i)) {
      return capitalize(str);
    }

    throw new Error(
      `Component "${this.tagName}" prop "${this.name}" value "${str}" cannot be converted to an Elm custom type constructor name. This should be a relatively easy enhancement to the Elm output target if you need to support it, however.`,
    );
  }

  customTypeName(): string {
    return capitalize(this.name);
  }

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}${this.customTypeName()}`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return this.required
      ? `Just (attribute "${this.name}" (${this.configArgName()}ToString ${
          (!isOnly && 'attributes.') || ''
        }${this.configArgName()}))`
      : [
          `Maybe.map`,
          `            (\\value -> attribute "${
            this.name
          }" (${this.configArgName()}ToString value))`,
          `            ${
            (!isOnly && 'attributes.') || ''
          }${this.configArgName()}`,
        ].join('\n');
  }
}

class Event {
  // TODO support decoding CustomEvent detail values
  tagName: string;
  name: string;

  constructor(cmpMeta: ComponentCompilerMeta, event: ComponentCompilerEvent) {
    this.tagName = cmpMeta.tagName;
    this.name = event.name;
  }

  isSupported(): boolean {
    return true;
  }

  customTypeDeclaration(): null {
    return null;
  }

  customTypeEncoder(): null {
    return null;
  }

  customTypeName(): null {
    return null;
  }

  configFieldTypeAnnotation(): string {
    return `${this.configArgName()} : ${this.configArgTypeAnnotation()}`;
  }

  configArgName(): string {
    return this.eventHandlerName();
  }

  configArgTypeAnnotation(): string {
    return 'Maybe msg';
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return [
      `Maybe.map`,
      `            (\\msg -> on "${this.name}" (Decode.succeed msg))`,
      `            ${
        (!isOnly && 'attributes.') || ''
      }${this.eventHandlerName()}`,
    ].join('\n');
  }

  private eventHandlerName() {
    return `on${this.name.charAt(0).toUpperCase() + this.name.slice(1)}`;
  }
}
