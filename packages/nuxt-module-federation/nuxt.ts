import { defineNuxtModule } from "@nuxt/kit";
import { container } from 'webpack'
// @ts-ignore
import { NodeModuleFederation } from '@telenko/node-mf'
import NuxtModuleFederationPlugin from "./NuxtModuleFederationPlugin";

type RemoteDefinition = string | {
  requiredVersion: string
  eager?: boolean
  singleton?: boolean
}
interface ModuleFederationOptions {
  remotes: Record<string, RemoteDefinition>
}

interface ModuleFederationModuleOptions {
  federationOptions(isServer: boolean): ModuleFederationOptions
}

let options: ModuleFederationModuleOptions | null = null
export default defineNuxtModule({
  meta: {
    name: 'Module Federation Module'
  },
  setup(resolvedOptions:ModuleFederationModuleOptions, nuxt){

    options = resolvedOptions

    if (!options || typeof options.federationOptions !== 'function') {
      throw new Error('Please, provide federationOptions(isServer: boolean)')
    }

    const nitroOptions = nuxt.options.nitro || {}
    nitroOptions.minify = false

    /* Externals not set or set to boolean */
    if (typeof nitroOptions.externals === 'boolean' || typeof nitroOptions.externals == 'undefined') {
      if (nitroOptions.externals === false) {
        console.warn('nitro.externals was set to false, this setting will be ignored')
      }

      /* Assign externals */
      nitroOptions.externals = { external: [] }
    }

    /* Check to be sure */
    if (typeof nitroOptions.externals.external === 'undefined') {
      nitroOptions.externals.external = []
    }

    /* Push vue as external */
    nitroOptions.externals.external.push('vue')

    /* Assign back */
    nuxt.options.nitro = nitroOptions

  },
  hooks: {
    "webpack:config"(configurations) {
      configurations.map(config => {
        const isServer = config.name === 'server'

        const federationOptions = options!.federationOptions(isServer)

        const ModuleFederation = isServer
            ? NodeModuleFederation
            : container.ModuleFederationPlugin

        config.plugins = config.plugins || []
        config.plugins.push(new ModuleFederation(federationOptions))
        /* Rewrite externals because they interfere with Module Federation */
        if (Array.isArray(config.externals) && config.externals.length) {
          for (const index in config.externals) {
            const external = config.externals[index]

            /* Can only rewrite functions */
            if (typeof external !== 'function') { return }

            config.externals[index] = (data, cb) => {
              const isRemote = Object.keys(federationOptions.remotes).some(
                  remoteKey => data.request!.startsWith(remoteKey)
              )

              if (data.request!.startsWith('webpack/container/reference/') || isRemote) {
                return cb(undefined, false)
              }

              return external(data, cb)
            }
          }
        }
        console.log(isServer, 'isServer')
        if (isServer) {
          config.plugins.push(new NuxtModuleFederationPlugin())
        }
      })
    },
  },
});
