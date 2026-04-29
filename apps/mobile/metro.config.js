// Expo Metro config that supports the pnpm monorepo (resolves @blesscupid/shared).
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// The codebase uses TS Bundler-style imports (`./Foo.js` → Foo.tsx). Metro's
// default resolver doesn't strip the .js suffix on TypeScript sources, so we
// fall back to .ts/.tsx siblings before giving up. Mirrors how tsc resolves
// these paths under "moduleResolution": "Bundler".
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const tryResolve = (name) =>
    baseResolveRequest
      ? baseResolveRequest(context, name, platform)
      : context.resolveRequest(context, name, platform);

  if (moduleName.endsWith('.js') && (moduleName.startsWith('./') || moduleName.startsWith('../'))) {
    const stem = moduleName.replace(/\.js$/, '');
    for (const ext of ['.tsx', '.ts']) {
      try {
        return tryResolve(stem + ext);
      } catch (_) {
        // try next
      }
    }
  }
  return tryResolve(moduleName);
};

module.exports = config;
