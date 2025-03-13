<template>
    <div class="min-h-screen flex flex-col items-center justify-center">
        <h1 class="text-3xl font-bold mb-4">Register</h1>
        <form @submit.prevent="onRegister" class="w-full max-w-sm flex flex-col space-y-4">
            <input v-model="username" type="text" placeholder="Username" class="input" required />
            <input v-model="email" type="email" placeholder="Email" class="input" required />
            <input v-model="password" type="password" placeholder="Password" class="input" required />
            <!-- Center the button -->
            <div class="flex justify-center items-center">
                <button label="Register" type="submit" :disabled="loading"
                    class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md cursor-pointer">
                    <template v-if="loading">
                        <div class="flex">
                            <ProgressSpinner style="width: 20px; height: 20px; margin-right: 8px" strokeWidth="8"
                                fill="transparent" animationDuration=".5s" aria-label="Logging in..." />
                            Loading...
                        </div>
                    </template>
                    <template v-else>Register</template>
                </button>
            </div>

        </form>
    </div>
</template>

<!-- <div class="flex justify-center">
    <button label="Register" type="submit" :disabled="loading"
        class="w-[100px] bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md cursor-pointer">
        <template v-if="loading">
            <ProgressSpinner style="width: 20px; height: 20px; margin-right: 8px" strokeWidth="8"
                fill="transparent" animationDuration=".5s" aria-label="Logging in..." />
            Loading...
        </template>
        <template v-else>Register</template>
    </button>
</div> -->

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();
const { register } = useAuth();
const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);

// const onRegister = async () => {
// try {
// await register(username.value, email.value, password.value);
// navigateTo('/login');
// } catch (error) {
// console.error('Registration failed:', error);
// }
// };
const onRegister = async () => {
    loading.value = true; // Start loading
    try {
        await register(username.value, email.value, password.value);

        // ✅ This will only run if registration is successful
        toast.success("Registration successful! Redirecting to login...", {
            timeout: 2000,
        });

        setTimeout(() => {
            navigateTo('/login');
        }, 2000);
    } catch (err: any) {
        console.error("Registration failed:", err);

        // ❌ Prevent showing success toast when registration fails
        toast.error(err.message || "Registration failed. Please try again.", {
            timeout: 3000,
        });
    } finally {
        loading.value = false;
    }
};

</script>