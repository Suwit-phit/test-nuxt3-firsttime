// import { jwtDecode } from "jwt-decode";

// export default defineNuxtRouteMiddleware(async (to) => {
//     const accessToken = useCookie('accessToken').value;
//     const refreshToken = useCookie('refreshToken').value;
//     const isTokenExpired = (token: string): boolean => {
//         const decoded: { exp: number } = jwtDecode(token);
//         return decoded.exp * 1000 < Date.now();
//     };

//     if (['/login', '/register'].includes(to.path)) return;

//     // Check access token expiration
//     if (accessToken && isTokenExpired(accessToken)) {
//         try {
//             await $fetch('/refresh-token', { method: 'POST', credentials: 'include' });
//         } catch (error) {
//             alert('Access token expired. Please log in again.');
//             return navigateTo('/login');
//         }
//     }

//     // Check refresh token expiration
//     if (!accessToken && refreshToken && isTokenExpired(refreshToken)) {
//         alert('Session expired. Please log in again.');
//         return navigateTo('/login');
//     }

//     if (!accessToken) return navigateTo('/login');
// });


//! without auto logout
// export default defineNuxtRouteMiddleware(async (to, from) => {
//     const accessToken = useCookie('accessToken').value;
//     const refreshToken = useCookie('refreshToken').value;

//     // Allow access to login and register pages
//     if (['/login', '/register'].includes(to.path)) {
//         return;
//     }

//     // Attempt to refresh the access token if missing
//     if (!accessToken && refreshToken) {
//         try {
//             await $fetch('/refresh-token', { method: 'POST', credentials: 'include' });
//             return;
//         } catch (error) {
//             console.error('Token refresh failed:', error);
//         }
//     }

//     // Redirect to login if no valid access token or refresh token exists
//     if (!accessToken) {
//         return navigateTo('/login');
//     }
// });

//! working code below but not using refresh token
// export default defineNuxtRouteMiddleware((to, from) => {
//     const accessToken = useCookie('accessToken').value;

//     // Allow access to login and register pages
//     if (['/login', '/register'].includes(to.path)) {
//         return;
//     }

//     // Redirect to login if token is missing
//     if (!accessToken) {
//         return navigateTo('/login');
//     }
// });


// export default defineNuxtRouteMiddleware((to) => {
//     const accessToken = useCookie('accessToken').value;

//     console.log('Middleware - Access Token:', accessToken);
//     console.log('Middleware - Current Path:', to.path);

//     // Redirect if not authenticated and not on a public route
//     if (!accessToken && !['/login', '/register'].includes(to.path)) {
//         console.log('Redirecting to /login because user is not authenticated');
//         return navigateTo('/login');
//     }

//     // Optional: If the user is logged in, restrict access to login/register pages
//     if (accessToken && ['/login', '/register'].includes(to.path)) {
//         console.log('Redirecting to / because user is already authenticated');
//         return navigateTo('/');
//     }
// });




// export default defineNuxtRouteMiddleware(async (to) => {
//     const isAuthenticated = useCookie('accessToken').value;

//     if (!isAuthenticated && to.path !== '/login' && to.path !== '/register') {
//         return navigateTo('/login');
//     }
// });


// export default defineNuxtRouteMiddleware((to) => {
//     const isAuthenticated = useCookie('accessToken').value;
//     if (!isAuthenticated && to.path !== '/login' && to.path !== '/register') {
//         return navigateTo('/login');
//     }
// });
