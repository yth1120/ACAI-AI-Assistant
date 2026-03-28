/**
 * Electron Builder 配置
 */

module.exports = {
  appId: 'com.acai.assistant',
  productName: 'ACAI',
  copyright: 'Copyright © 2025 ACAI Team',
  directories: {
    output: 'dist',
    buildResources: 'assets'
  },
  files: [
    'dist/main.js',
    'dist/preload.js',
    'dist-vue/**/*',
    'assets/**/*',
    'node_modules/duck-duck-scrape/**/*'
  ],
  asarUnpack: [
    'node_modules/duck-duck-scrape/**/*'
  ],
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    artifactName: '${productName}-${version}-Portable.${ext}',
    requestedExecutionLevel: 'asInvoker'
  },
  compression: 'maximum',
  asar: true,
  npmRebuild: false,
  buildDependenciesFromSource: false
}