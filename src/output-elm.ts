import path from 'path';
import { OutputTargetElm } from './types';
import { capitalize, dashToCamelCase, sortBy } from './utils';
import {
  CompilerCtx,
  ComponentCompilerMeta,
  ComponentCompilerProperty,
  Config,
} from '@stencil/core/internal';
import { Event, eventFromMetadata } from './event';
import { Prop } from './prop';

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
    components
      .map(generateProxyElmModule.bind(this, config, outputTarget))
      .map(({ filePath, moduleSrc }) =>
        compilerCtx.fs.writeFile(filePath, moduleSrc),
      ),
  );
}

// exported for testing
export function generateProxyElmModule(
  this: void,
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
import Html.Attributes exposing (attribute, property)
import Html.Events exposing (on)
import Json.Decode as Decode
import Json.Encode as Encode exposing (Value)\n\n\n`;

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

  return { filePath, moduleSrc };
}

function componentExposures(
  this: void,
  config: Config,
  cmpMeta: ComponentCompilerMeta,
): string[] {
  const attributeConfigs = componentAttributeConfigs(config, cmpMeta);

  return [
    'view',
    (attributeConfigs.length > 1 && 'Props') || '',
    ...attributeConfigs
      .flatMap((attributeConfig) => attributeConfig.customTypeNames())
      .map((attributeConfig) => `${attributeConfig}(..)`),
    ...attributeConfigs.flatMap((attributeConfig) =>
      attributeConfig.typeAliasNames(),
    ),
  ].filter((str) => str.length > 0);
}

function componentElm(
  this: void,
  config: Config,
  cmpMeta: ComponentCompilerMeta,
): string {
  const attributeConfigs = componentAttributeConfigs(config, cmpMeta);
  const takesChildren: boolean = cmpMeta.htmlTagNames.includes('slot');

  const elementFunctionType: string = [
    (attributeConfigs.length === 1 &&
      attributeConfigs[0].argTypeAnnotation()) ||
      (attributeConfigs.length > 1 && 'Props'),
    takesChildren && 'List (Html msg)',
    'Html msg',
  ]
    .filter((maybeFalsy) => !!maybeFalsy)
    .join('\n    -> ');

  const elementAttributesArg: string =
    (attributeConfigs.length === 1 && `${attributeConfigs[0].propName()} `) ||
    (attributeConfigs.length > 1 && 'props ') ||
    '';

  const attributes = [
    '([ ' +
      attributeConfigs
        .map((item) => item.maybeHtmlAttribute(attributeConfigs.length === 1))
        .join('\n         , '),
    '         ]',
    '            |> List.filterMap identity',
    '        )',
  ].join('\n');

  const elementChildrenArg: string = takesChildren ? 'children ' : '';

  const children = takesChildren ? 'children' : '[]';

  return [
    propTypeAlias(attributeConfigs) || '',
    [
      `view :`,
      `    ${elementFunctionType}`,
      `view ${elementAttributesArg}${elementChildrenArg}=`,
      `    node "${cmpMeta.tagName}"`,
      `        ${attributes}`,
      `        ${children}`,
    ].join('\n'),
    [
      ...new Set( // remove duplicates
        attributeConfigs.flatMap((attributeConfig) => [
          ...attributeConfig.customTypeDeclarations(),
          ...attributeConfig.typeAliasDeclarations(),
          ...attributeConfig.encoders(),
        ]),
      ),
    ].join('\n\n\n'),
  ]
    .filter((str) => str.length > 0)
    .join('\n\n\n');
}

function componentAttributeConfigs(
  this: void,
  config: Config,
  cmpMeta: ComponentCompilerMeta,
): (Prop | Event)[] {
  return [
    cmpMeta.properties.map((propMeta) => new Prop(config, cmpMeta, propMeta)),
    new Prop(config, cmpMeta, slotProperty()),
    cmpMeta.events.map(eventFromMetadata.bind(this, config, cmpMeta)),
  ]
    .flat()
    .filter((item) => item.isSupported());
}

function slotProperty(): ComponentCompilerProperty {
  return {
    name: 'slot',
    type: 'string',
    required: false,
    internal: false,
    mutable: false,
    optional: false,
    docs: { text: '', tags: [] },
    complexType: {
      original: 'string',
      resolved: 'string',
      references: {},
    },
  };
}

function propTypeAlias(attributeConfigs: (Prop | Event)[]): string | undefined {
  if (attributeConfigs.length > 1)
    return [
      `type alias Props ${
        // events require a msg type variable
        attributeConfigs.some((item) => item.type === 'event') ? 'msg ' : ''
      }=`,
      '    { ' +
        attributeConfigs
          .map((item) => item.fieldTypeAnnotation())
          .join('\n    , ') +
        '\n    }',
    ].join('\n');
}
