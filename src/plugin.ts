import { Config, OutputTargetCustom } from '@stencil/core/internal';
import { OutputTargetElm } from './types';
import { normalizePath } from './utils';
import { elmProxyOutput } from './output-elm';
import path from 'path';

export const elmOutputTarget = (
  outputTarget: OutputTargetElm,
): OutputTargetCustom => ({
  type: 'custom',
  name: 'elm-library',
  validate(config) {
    return normalizeOutputTarget(config, outputTarget);
  },
  async generator(config, compilerCtx, buildCtx) {
    const timespan = buildCtx.createTimeSpan(`generate elm started`, true);

    await elmProxyOutput(
      compilerCtx,
      outputTarget,
      buildCtx.components,
      config,
    );

    timespan.finish(`generate elm finished`);
  },
});

function normalizeOutputTarget(config: Config, outputTarget: any) {
  const results: OutputTargetElm = {
    ...outputTarget,
    excludeComponents: outputTarget.excludeComponents || [],
  };

  if (config.rootDir == null) {
    throw new Error(
      'rootDir is not set and it should be set by stencil itself',
    );
  }
  if (outputTarget.proxiesModuleDir == null) {
    throw new Error('proxiesModuleDir is required');
  }

  if (
    outputTarget.proxiesModuleDir &&
    !path.isAbsolute(outputTarget.proxiesModuleDir)
  ) {
    results.proxiesModuleDir = normalizePath(
      path.join(config.rootDir, outputTarget.proxiesModuleDir),
    );
  }

  return results;
}
