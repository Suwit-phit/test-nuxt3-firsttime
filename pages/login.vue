<template>
    <div class="min-h-screen flex flex-col items-center justify-center">
        <h1 class="text-3xl font-bold mb-4">Login</h1>
        <form @submit.prevent="onLogin" class="w-full max-w-sm space-y-4">
            <input v-model="usernameOrEmail" type="text" placeholder="Username or Email" class="input" required />
            <input v-model="password" type="password" placeholder="Password" class="input ml-2" required />

            <!-- Login Button with Spinner -->
            <Button type="submit" :disabled="loading">
                <template v-if="loading">
                    <ProgressSpinner style="width: 20px; height: 20px; margin-right: 8px" strokeWidth="8"
                        fill="transparent" animationDuration=".5s" aria-label="Logging in..." />
                    Loading...
                </template>
                <template v-else>
                    Login
                </template>
            </Button>
        </form>

        <div class="mt-4">
            <p class="text-sm">
                Don't have an account?
                <Button label="Register" variant="link" @click="goToRegister" />
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
// import Toast from 'vue-toastification';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
// const toast = Toast.useToast();
const { login } = useAuth();
const usernameOrEmail = ref('');
const password = ref('');
const loading = ref(false);

const onLogin = async () => {
    loading.value = true; // Start loading
    try {
        await login(usernameOrEmail.value, password.value);
        toast.success("Login successful! Redirecting to Homepage...", {
            timeout: 2000,
        });

        setTimeout(() => {
            navigateTo('/');
        }, 2000);
    } catch (error: any) {
        console.error('Login failed:', error);
        toast.error(error.message || "Login failed. Please try again.", {
            timeout: 3000,
        });
    } finally {
        loading.value = false; // Stop loading after login attempt
    }
};

const goToRegister = () => {
    navigateTo('/register');
};
</script>


<!-- //! End -->
<!-- <template>
    <div>
        <h1>Login Page</h1>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped></style> -->