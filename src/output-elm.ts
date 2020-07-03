import { OutputTargetElm } from './types';
import { sortBy, dashToCamelCase } from './utils';
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

  await generateProxyElmModule(
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

async function generateProxyElmModule(
  this: void,
  compilerCtx: CompilerCtx,
  config: Config,
  components: ComponentCompilerMeta[],
  outputTarget: OutputTargetElm,
) {
  // TODO don't expose all
  const moduleDeclaration = `module ${outputTarget.proxiesModuleName} exposing
    ( ${components
      .map((c) => dashToCamelCase(c.tagName))
      .join('\n    , ')}\n    )\n`;

  const imports = `import Html exposing (Html, node)
import Html.Attributes exposing (attribute)
import Html.Events exposing (on)
import Json.Decode as Decode\n\n\n`;

  const codegenWarningComment =
    '-- AUTO-GENERATED PROXIES FOR CUSTOM ELEMENTS\n\n';

  const generatedCode = components
    .map(componentElm.bind(this, config))
    .join('\n');

  const moduleSrcParts: string[] = [
    moduleDeclaration,
    imports,
    codegenWarningComment,
    generatedCode,
  ];

  const moduleSrc = moduleSrcParts.join('\n') + '\n';

  return compilerCtx.fs.writeFile(outputTarget.proxiesFile, moduleSrc);
}

function componentElm(
  this: void,
  config: Config,
  cmpMeta: ComponentCompilerMeta,
): string {
  const tagNameAsCamel = dashToCamelCase(cmpMeta.tagName);

  const configItems: (Prop | Event)[] = [
    cmpMeta.properties.map(propFromMetadata.bind(this, config, cmpMeta)),
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
    `${tagNameAsCamel} :`,
    `    ${elementFunctionType}`,
    `${tagNameAsCamel} ${elementAttributesArg}${elementChildrenArg}=`,
    `    node "${cmpMeta.tagName}"`,
    `        ${attributes}`,
    `        ${children}\n\n`,
  ].join('\n');
}

function propFromMetadata(
  config: Config,
  cmpMeta: ComponentCompilerMeta,
  propMeta: ComponentCompilerProperty,
): Prop {
  const attributeClassByType = new Map<string, typeof Prop>([
    ['boolean', BooleanProp],
    ['string', StringProp],
  ]);

  const attributeClassForProp =
    attributeClassByType.get(propMeta.type) || UnsupportedProp;

  const attribute = new attributeClassForProp(cmpMeta, propMeta);

  if (!attribute.isSupported()) {
    config.logger?.warn(
      `Component "${cmpMeta.tagName}" prop "${propMeta.name}" of type "${propMeta.type}" is not supported by Elm output target.`,
    );
  }

  return attribute;
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

  constructor(cmpMeta: ComponentCompilerMeta, prop: ComponentCompilerProperty) {
    this.tagName = cmpMeta.tagName;
    this.name = prop.name;
    this.type = prop.type;
    this.required = prop.required;
  }

  isSupported(): boolean {
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

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}Bool`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return (this.required
      ? [
          `Just (attribute "${this.name}"`,
          `            (if ${(!isOnly && 'attributes.') || ''}${
            this.name
          } then`,
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
          `            ${(!isOnly && 'attributes.') || ''}${this.name}`,
        ]
    ).join('\n');
  }
}

class StringProp extends Prop {
  isSupported(): boolean {
    return true;
  }

  configArgTypeAnnotation(): string {
    return `${!this.required ? 'Maybe ' : ''}String`;
  }

  maybeHtmlAttribute(isOnly: boolean): string {
    return this.required
      ? `Just (attribute "${this.name}" ${(!isOnly && 'attributes.') || ''}${
          this.name
        })`
      : `Maybe.map (attribute "${this.name}") ${
          (!isOnly && 'attributes.') || ''
        }${this.name}`;
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
