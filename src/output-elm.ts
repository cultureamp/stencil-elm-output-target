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

  const supportedProps: Attribute[] = cmpMeta.properties
    .map(attributeForProp.bind(this, config, cmpMeta))
    .filter((attribute) => attribute.isSupported());

  const compatibleEvents: {
    name: string;
  }[] = cmpMeta.events
    .map((eventMeta) => event(eventMeta))
    .flatMap((maybeNull) => (!!maybeNull ? [maybeNull] : [])); // filter out nulls

  const takesChildren: boolean = cmpMeta.htmlTagNames.includes('slot');

  const elementFunctionType: string = [
    supportedProps.length > 0 &&
      '{ ' +
        [
          supportedProps.map((attribute) =>
            attribute.configFieldTypeAnnotation(),
          ),
          compatibleEvents.map(({ name }) => `${eventHandlerName(name)} : msg`),
        ]
          .flat()
          .join('\n    , ') +
        '\n    }',
    takesChildren && 'List (Html msg)',
    'Html msg',
  ]
    .filter((maybeFalsy) => !!maybeFalsy)
    .join('\n    -> ');

  const elementAttributesArg: string =
    supportedProps.length > 0 ? 'attributes ' : '';

  const attributes =
    '[ ' +
    [
      supportedProps.map((attribute) => attribute.htmlAttributeExpression()),
      compatibleEvents.map((event) => eventElm(event)),
    ]
      .flat()
      .join('\n        , ') +
    '\n        ]';

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

function attributeForProp(
  config: Config,
  cmpMeta: ComponentCompilerMeta,
  prop: ComponentCompilerProperty,
): Attribute {
  const attributeClassByType = new Map<string, typeof Attribute>([
    ['boolean', BooleanAttribute],
    ['string', StringAttribute],
  ]);

  const attributeClassForProp =
    attributeClassByType.get(prop.type) || UnsupportedAttribute;

  const attribute = new attributeClassForProp(cmpMeta, prop);

  if (!attribute.isSupported()) {
    config.logger?.warn(
      `Component "${cmpMeta.tagName}" prop "${prop.name}" of type "${prop.type}" is not supported by Elm output target.`,
    );
  }

  return attribute;
}

function event(eventMeta: ComponentCompilerEvent): { name: string } | null {
  // TODO support decoding CustomEvent detail values
  return { name: eventMeta.name };
}

function eventElm(event: { name: string }): string {
  return `on "${event.name}" (Decode.succeed attributes.${eventHandlerName(
    event.name,
  )})`;
}

function eventHandlerName(eventName: string) {
  return `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;
}

class Attribute {
  tagName: string;
  name: string;
  type: string;

  constructor(cmpMeta: ComponentCompilerMeta, prop: ComponentCompilerProperty) {
    this.tagName = cmpMeta.tagName;
    this.name = prop.name;
    this.type = prop.type;
  }

  isSupported(): boolean {
    throw new Error('not implemented');
  }

  configFieldTypeAnnotation(): string {
    throw new Error('not implemented');
  }

  htmlAttributeExpression(): string {
    throw new Error('not implemented');
  }
}

class UnsupportedAttribute extends Attribute {
  isSupported(): boolean {
    return false;
  }
}

class BooleanAttribute extends Attribute {
  isSupported(): boolean {
    return true;
  }

  configFieldTypeAnnotation(): string {
    return `${this.name} : Bool`;
  }

  htmlAttributeExpression(): string {
    return [
      `attribute "${this.name}"`,
      `            (if attributes.${this.name} then`,
      `                "true"`,
      ``,
      `             else`,
      `                "false"`,
      `            )`,
    ].join('\n');
  }
}

class StringAttribute extends Attribute {
  isSupported(): boolean {
    return true;
  }

  configFieldTypeAnnotation(): string {
    return `${this.name} : String`;
  }

  htmlAttributeExpression(): string {
    return `attribute "${this.name}" attributes.${this.name}`;
  }
}
