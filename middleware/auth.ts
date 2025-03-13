// middleware/auth.ts
// import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt3'
// import Cookies from 'js-cookie';

// export default defineNuxtRouteMiddleware((to, from) => {
//     const accessToken = Cookies.get('accessToken');

//     // If the user is not logged in and is trying to access a protected route
//     if (!accessToken && to.name !== 'login') {
//         console.log("inside auth middleware");
//         return navigateTo('/login');  // Redirect to login page
//     }
// });

export default defineNuxtRouteMiddleware((to, from) => {
    const accessToken = useCookie('accessToken'); // useCookie works SSR & CSR

    // Ensure we check properly
    if (!accessToken.value && to.name !== 'login') {
        console.log("inside auth middleware: no token found, redirecting...");
        return navigateTo('/login');  
    }

    console.log("inside auth middleware: token found, proceeding...");
});



// // middleware/auth.js

// import Cookies from 'js-cookie';

// export default defineNuxtRouteMiddleware((to, from) => {
//     const accessToken = Cookies.get('accessToken');

//     // If the user is not logged in and is trying to access a protected route
//     if (!accessToken && to.name !== 'login') {
//         return navigateTo('/login');  // Redirect to login page
//     }
// });
