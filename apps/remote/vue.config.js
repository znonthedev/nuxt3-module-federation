const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
const {dependencies} = require('./package.json')
const {UniversalFederationPlugin} = require("@module-federation/node");

/**
 * Federates the application
 * @param {*} config The chain webpack config
 */
function enableModuleFederation (config, isServer) {
  /* Get the needed module federation plugin */
  const ModuleFederationPlugin = isServer
      ? require('@telenko/node-mf').NodeModuleFederation
      : require('webpack').container.ModuleFederationPlugin

  config.plugin('module-federation').use(ModuleFederationPlugin, [{
    name: 'remote',
    filename: 'remoteEntry.js',
    exposes: {
      './ButtonTest.vue': './src/components/Button.vue'
    },
    shared: dependencies
  }])

  /* We need special handling for node, but for client the job is done */
  if (!isServer) { return }

  /* Interfere with build in order to use HTTP+VM instead of require */
  config.plugin('node-async-http-runtime').use(require('@telenko/node-mf').NodeAsyncHttpRuntime)

  /* Set target to false, this is needed for NodeAsyncHttpRuntime */
  config.target(false)
}


const isServerBuild = process.env.SSR
const basePath = 'http://localhost:6100'

const publicPath = (isServerBuild ? basePath + '/server' : basePath + '/client')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath,
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
  },
  chainWebpack(config){
    enableModuleFederation(config, isServerBuild)
  }
})
