export default defineNuxtRouteMiddleware((to, from) => {
    const accessToken = useCookie('accessToken');

    console.log("🔒 Auth Middleware Triggered");
    console.log("🔹 Navigating to:", to.name);
    // console.log("🔑 Token:", accessToken.value);

    // If user is logged in, prevent access to login page
    if (accessToken.value && to.name === 'login') {
        console.log("✅ User is logged in, redirecting to home...");
        return navigateTo('/');
    }

    // If user is NOT logged in, restrict access to protected pages
    if (!accessToken.value && to.name !== 'login') {
        console.log("⛔ No token found, redirecting to login...");
        return navigateTo('/login');
    }

    console.log("✅ Proceeding to page...");
});
