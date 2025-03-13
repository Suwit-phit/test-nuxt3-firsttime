import { defineNuxtPlugin } from '#app'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css' // if needed

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(Toast)
})

// import Toast from "vue-toastification";
// import "vue-toastification/dist/index.css";
// import { defineNuxtPlugin } from "#app";

// export default defineNuxtPlugin((nuxtApp) => {
//     nuxtApp.vueApp.use(Toast, {
//         timeout: 5000, // Default timeout for toasts
//         position: "top-right", // Toast position
//     });
// });
