// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    builder:'webpack',
    modules: [
        ['@nuxtmf/nuxt-module-federation', {
            federationOptions: (isServer: boolean) => ({
                name: 'test',
                remotes: {
                    'remote': isServer
                        ? 'remote@http://localhost:6100/server/remoteEntry.js'
                        : 'remote@http://localhost:6100/client/remoteEntry.js'
                }
            })
        }],
        '@nuxtmf/ui-components'
    ],
    experimental: {
        asyncEntry: true,

    }
})
