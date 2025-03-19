// export default defineNuxtConfig({
//   hooks: {
//     'pages:extend'(routes) {
//       routes.push({
//         name: 'home',
//         path: '/',
//         file: '~/pages/dashboard.vue',
//         // file: '~/pages/index.vue',
//       });
//     },
//   },
//   modules: ['@nuxtjs/tailwindcss'],

//   tailwindcss: {
//     cssPath: '~/assets/css/main.css',
//   },

//   runtimeConfig: {
//     public: {
//       apiBase: 'http://localhost:8000', // Backend API URL
//     },
//   },

//   compatibilityDate: '2025-01-28',
// });



// // https://nuxt.com/docs/api/configuration/nuxt-config
// export default defineNuxtConfig({
//   // modules: ['@nuxtjs/tailwindcss'],
//   modules: ['@nuxtjs/tailwindcss'],
//   tailwindcss: {
//     cssPath: '~/assets/css/tailwind.css',
//     configPath: 'tailwind.config.js',
//   },
//   compatibilityDate: '2025-01-28',
//   devtools: { enabled: true },
// })

// export default defineNuxtConfig({
//   modules: ['@nuxtjs/tailwindcss'],
//   // css: ['~/assets/css/tailwind.css'],
//   compatibilityDate: '2025-01-29',
// });

import tailwindcss from "@tailwindcss/vite";
import Aura from '@primevue/themes/aura';

export default defineNuxtConfig({
  // modules: ["@nuxtjs/tailwindcss"],
  compatibilityDate: '2025-01-29',
  css: ['~/assets/css/main.css',],
  // css: ['~/assets/css/main.css',],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ['@primevue/nuxt-module',],
  primevue: {
    options: {
      theme: {
        preset: Aura
      }
    }
  },
  build: {
    transpile: ['vue-toastification'],
  },
  // router: {
  //   options: {
  //     middleware: ['auth'] // Ensure this is included
  //   }
  // }
});