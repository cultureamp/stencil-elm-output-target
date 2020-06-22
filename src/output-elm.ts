import { OutputTargetElm } from './types';
import { sortBy, dashToCamelCase } from './utils';
import {
  CompilerCtx,
  ComponentCompilerMeta,
  Config,
  ComponentCompilerProperty,
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

  await generateProxyElmModule(compilerCtx, filteredComponents, outputTarget);
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
  compilerCtx: CompilerCtx,
  components: ComponentCompilerMeta[],
  outputTarget: OutputTargetElm,
) {
  // TODO don't expose all
  const moduleDeclaration = `module ${outputTarget.proxiesModuleName} exposing (..)\n`;

  const codegenWarningComment =
    '-- AUTO-GENERATED PROXIES FOR CUSTOM ELEMENTS\n\n';

  const imports = `import Html exposing (Html, node)
import Html.Attributes exposing (attribute)\n\n\n`;

  const moduleSrcParts: string[] = [
    moduleDeclaration,
    imports,
    codegenWarningComment,
    components.map(componentElm).join('\n'),
  ];

  const moduleSrc = moduleSrcParts.join('\n') + '\n';

  return compilerCtx.fs.writeFile(outputTarget.proxiesFile, moduleSrc);
}

function componentElm(cmpMeta: ComponentCompilerMeta): string {
  const tagNameAsCamel = dashToCamelCase(cmpMeta.tagName);

  const compatibleProps: {
    name: string;
    type: string;
  }[] = cmpMeta.properties
    .map((prop) => attribute(prop))
    .flatMap((maybeNull) => (!!maybeNull ? [maybeNull] : [])); // filter out nulls

  const takesChildren: boolean = cmpMeta.htmlTagNames.includes('slot');

  const elementFunctionType: string = [
    compatibleProps.length > 0 &&
      '{ ' +
        compatibleProps
          .map(({ name, type }) => `${name} : ${type}`)
          .join(',\n') +
        ' }',
    takesChildren && 'List (Html msg)',
    'Html msg',
  ]
    .filter((maybeFalsy) => !!maybeFalsy)
    .join(' -> ');

  const elementAttributesArg: string =
    compatibleProps.length > 0 ? 'attributes ' : '';

  const attributes =
    '[ ' + compatibleProps.map((prop) => attributeElm(prop)).join(',\n') + ' ]';

  const elementChildrenArg: string = takesChildren ? 'children ' : '';

  const children = takesChildren ? 'children' : '[]';

  return [
    `${tagNameAsCamel} : ${elementFunctionType}`,
    `${tagNameAsCamel} ${elementAttributesArg}${elementChildrenArg}=`,
    `    node "${cmpMeta.tagName}" ${attributes} ${children}\n\n`,
  ].join('\n');
}

function attribute(
  prop: ComponentCompilerProperty,
): { name: string; type: string } | null {
  const elmTypes = new Map([['string', 'String']]);

  if (elmTypes.has(prop.type)) {
    return { name: prop.name, type: elmTypes.get(prop.type) as string };
  }

  // attribute type not supported
  return null;
}

function attributeElm(prop: { name: string }): string {
  return `attribute "${prop.name}" attributes.${prop.name}`;
}
