<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Toolbar from "primevue/toolbar";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import Tag from "primevue/tag";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from 'vue-toastification';
import { useAuth } from '@/composables/useAuth';
import 'primeicons/primeicons.css'
import Skeleton from 'primevue/skeleton';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';

import { useRouter } from "vue-router";
import { jwtDecode } from 'jwt-decode';
import api from '@/composables/useAuth'; // Import the API instance

interface Owner {
    id: string;
    username: string;
    email: string;
}

interface Card {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    owner?: Owner; // Ensure owner is correctly typed
}

// interface Card {
//     id: string;
//     name: string;
//     owner?: string; // Adjust based on your actual data structure
// }
interface newCard {
    name: string;
}

const accessToken = useCookie('accessToken');
const expired = ref(false);
const toast = useToast();
// const cards = ref([]);
const cards = ref<Card[]>([]); // Explicitly type the ref as an array of Card objects
const selectedCards = ref([]);
// const filters = ref({
//     global: { value: null },
// });
const filters = ref({
    global: { value: null, matchMode: 'contains' }, // Add matchMode here
});

const { logout, checkTokens } = useAuth();

const confirm = useConfirm();

// const owner = ref(null); // <-- Define owner before using it
const owner = ref<Owner | null>(null)

const isDialogVisible = ref(false); // Controls the visibility of the form/modal
const newCard = ref<newCard>({ name: "" }); // Stores the new card data

// Refs to manage form and dialog visibility
const isEditMode = ref(false); // Track edit mode
const editedCardId = ref<string | null>(null); // Store card ID for editing

const loading = ref(false);
const loadingLogoutDelete = ref(false);
const operation = ref<string>(''); // Track the current operation (logout, delete card, delete selected cards)
const loadingEditSave = ref(false);

// Fetch data from Symfony API
const fetchCards = async () => {
    loading.value = true; // Start loading
    try {
        // const response = await axios.get("http://localhost:8000/api/cards"); // Adjust API URL
        // cards.value = response.data["hydra:member"]; // Extract relevant data from API response
        const response = await api.get('/api/cards', {
            headers: {
                Authorization: `Bearer ${useCookie('accessToken').value}`,
                'Accept': 'application/json'
            }
        })
        console.log("test response = ", response);
        console.log("test response.data = ", response.data);
        console.log("test response.data.cards = ", response.data.cards);
        console.log("test owner = ", response.data.owner);
        // cards.value = response.data;
        // cards.value = response.data.cards;
        // owner.value = response.data.owner;
        // Assign owner to each card
        // const fetchedCards = response.data.cards.map(card => ({
        //     ...card,
        //     owner: response.data.owner // Assign owner to each card
        // }));

        //! This is 
        const fetchedCards = response.data.cards.map((card: Card) => ({
            ...card,
            owner: response.data.owner || {} // Assign owner to each card
        }));
        // const owner: Owner = response.data.owner;

        // const fetchedCards: Card[] = response.data.cards.map((card: Card) => ({
        //     ...card,
        //     owner: owner, // Ensure owner is assigned correctly
        // }));

        cards.value = fetchedCards;
        owner.value = response.data.owner;
    } catch (error) {
        console.error("Error fetching cards:", error);
    } finally {
        loading.value = false;
    }
};

const saveCard = async () => {
    loadingEditSave.value = true;
    try {

        if (isEditMode.value && editedCardId.value) {
            console.log("under isEditMode.value && editedCardId.value")
            console.log("editedCardId.value = ", editedCardId.value)
            // Update existing card
            const response = await api.patch(`/api/cards/${editedCardId.value}`, newCard.value, {
                headers: {
                    Authorization: `Bearer ${useCookie('accessToken').value}`,
                    'Content-Type': 'application/json'
                }
            });

            // Remove the old card from the list
            const index = cards.value.findIndex(card => card.id === editedCardId.value);
            if (index !== -1) {
                cards.value.splice(index, 1); // Remove the outdated entry
            }

            // Add the updated card at the top
            cards.value.unshift(response.data as Card);

            toast.success("Card updated successfully!");
            isDialogVisible.value = false; // Close the dialog
        } else {
            // Create new card
            // await api.post('/api/cards', newCard.value);

            // // Success toast and closing dialog
            // toast.success("Card added successfully!");
            console.log("else under isEditMode.value && editedCardId.value")
            const response = await api.post('/api/cards', newCard.value, {
                headers: {
                    Authorization: `Bearer ${useCookie('accessToken').value}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success("Card added successfully!");
            // cards.value.push(response.data as Card); // Add the new card to the list
            // .push() adds the new card at the bottom.
            // .unshift() adds the new card at the top.
            cards.value.unshift(response.data as Card); // Add the new card to the list
            isDialogVisible.value = false; // Close the dialog
        }

        resetDialog(); // Reset form and hide dialog
        // const response = await api.post('/api/cards', newCard.value, {
        //     headers: {
        //         Authorization: `Bearer ${useCookie('accessToken').value}`,
        //         'Content-Type': 'application/json'
        //     }
        // });

        // toast.success("Card added successfully!");
        // // cards.value.push(response.data as Card); // Add the new card to the list
        // // .push() adds the new card at the bottom.
        // // .unshift() adds the new card at the top.
        // cards.value.unshift(response.data as Card); // Add the new card to the list
        // isDialogVisible.value = false; // Close the dialog
    } catch (error: any) {
        console.error("Error adding card:", error);

        // console.log("errorMessage for error.response = ", error.response);
        // console.log("errorMessage for error.response.data = ", error.response.data);
        // if (error.response && error.response.data) {
        //     console.log("errorMessage for error.response.data.violations = ", error.response.data.violations);
        //     console.log("errorMessage for error.response.data.violations.message = ", error.response.data.violations.message);
        //     const errorMessage = error.response.data.message || "Failed to add card!";
        //     console.log("errorMessage for saveCard = ", errorMessage);
        //     console.log("errorMessage for error.response.data.message = ", error.response.data.message);
        //     toast.error(errorMessage, { timeout: 3000 });
        // } else {
        //     toast.error("An unexpected error occurred!", { timeout: 3000 });
        // }
        if (error.response && error.response.data) {
            const responseData = error.response.data;

            if (responseData.violations && responseData.violations.length > 0) {
                // Extract validation error messages
                const errorMessages = responseData.violations.map((v: any) => v.message).join(", ");
                toast.error(errorMessages, { timeout: 4000 });
            } else {
                // Generic error message
                const errorMessage = responseData.message || "Failed to add card!";
                toast.error(errorMessage, { timeout: 3000 });
            }
        } else {
            toast.error("An unexpected error occurred!", { timeout: 3000 });
        }
    } finally {
        loadingEditSave.value = false
    }
};

// Reset the dialog and form
const resetDialog = () => {
    isDialogVisible.value = false; // Hide the dialog
    newCard.value = { name: "" }; // Clear form
    isEditMode.value = false; // Reset edit mode
    editedCardId.value = null; // Clear card ID
};


// const openNew = () => {
//     console.log("Open New Card Form");
// };
const openNew = () => {
    newCard.value = { name: "" }; // Reset the form
    isDialogVisible.value = true; // Show the dialog/modal
};

// const confirmDeleteSelected = () => {
//     console.log("Delete Selected Cards:", selectedCards.value);
// };
const confirmDeleteSelected = () => {
    operation.value = 'deleteSelectedCards'; // Set the operation to 'deleteSelectedCards'
    confirm.require({
        message: "Are you sure you want to delete the selected cards?",
        header: "Confirm Deletion",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes",
        rejectLabel: "No",
        accept: async () => {
            loadingLogoutDelete.value = true
            try {
                // Extract IDs from selectedCards
                const idsToDelete = selectedCards.value.map((card: Card) => card.id);

                // Call API to delete each card
                await Promise.all(idsToDelete.map(id =>
                    api.delete(`/api/cards/${id}`, {
                        headers: { Authorization: `Bearer ${useCookie('accessToken').value}` }
                    })
                ));

                // Remove deleted cards from the list
                cards.value = cards.value.filter(card => !idsToDelete.includes(card.id));

                // Reset selected cards
                selectedCards.value = [];

                toast.success("Selected cards deleted successfully!");
            } catch (error) {
                console.error("Error deleting selected cards:", error);
                toast.error("Failed to delete selected cards!");
            } finally {
                loadingLogoutDelete.value = false
            }
        },
        reject: () => {
            toast.info("Deletion cancelled.");
        }
    });
};


const exportCSV = () => {
    console.log("Export Cards as CSV");
};

// const editCard = (card: Card) => {
//     console.log("Editing card:", card);
// };

// Open dialog for editing or creating a new card
const editCard = (card: { id: string, name: string }) => {
    newCard.value = { name: card.name }; // Prefill the form with existing data
    editedCardId.value = card.id; // Set the ID of the card being edited
    isEditMode.value = true; // Set edit mode
    isDialogVisible.value = true; // Show the dialog
};

// const confirmDeleteCard = (card: Card) => {
//     confirm.require({
//         message: "Are you sure you want to delete this card?",
//         header: "Delete Confirmation",
//         icon: "pi pi-exclamation-triangle",
//         acceptLabel: "Yes, Delete",
//         rejectLabel: "Cancel",
//         accept: async () => {
//             console.log("Deleting card:", card);
//         },
//     });
// };
const confirmDeleteCard = (card: Card) => {
    operation.value = 'deleteCard'; // Set the operation to 'deleteCard'
    confirm.require({
        message: `Are you sure you want to delete "${card.name}"?`,
        header: "Confirm Deletion",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes",
        rejectLabel: "No",
        accept: async () => {
            loadingLogoutDelete.value = true
            try {
                await api.delete(`/api/cards/${card.id}`, {
                    headers: { Authorization: `Bearer ${useCookie('accessToken').value}` }
                });

                // Remove deleted card from the list
                cards.value = cards.value.filter(c => c.id !== card.id);

                toast.success(`"${card.name}" deleted successfully!`);
            } catch (error) {
                console.error("Error deleting card:", error);
                toast.error(`Failed to delete "${card.name}"!`);
            } finally {
                loadingLogoutDelete.value = false
            }
        },
        reject: () => {
            toast.info("Deletion cancelled.");
        }
    });
};


// Confirm logout
const confirmLogout = (event: MouseEvent) => {
    operation.value = 'logout'; // Set the operation to 'logout'
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            loadingLogoutDelete.value = true;
            // await logout_();
            await onLogout();
            loadingLogoutDelete.value = false;
        },
    });
};

// On manual logout
const onLogout = async () => {
    try {
        console.log("in onLogout");
        await logout();
        navigateTo('/login');
    } catch (error: any) {
        console.log('manual Logout error:');
        // toast.error('Logout failed!');
        toast.error(error.message || 'Logout failed!', {
            timeout: 3000,
        });
    }
};

// Fetch data when the component is mounted
// onMounted(fetchCards);
// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        const checkTime = decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Function to check token validity and expire status
const checkExpiration = () => {
    if (isTokenExpired(accessToken.value!)) {
        console.log('Access token expired.');
        expired.value = true;
    } else {
        expired.value = false;
    }
};

// Declare the interval variable with the correct type
let intervalId: ReturnType<typeof setInterval>;

// Declare the timeout variable for auto-logout
let logoutTimeout: ReturnType<typeof setTimeout> | null = null;

// Function to calculate the auto logout time (2-3 seconds before expiration)
const calculateAutoLogoutTime = (token: string) => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        // Subtract 2 seconds from the expiration time (you can adjust this to 3 seconds if needed)
        return decoded.exp * 1000 - Date.now() - 2000; // 2000ms = 2 seconds before expiration
    } catch (error) {
        console.error('Error decoding token:', error);
        return 0; // Default to immediate logout if token decoding fails
    }
};

// Check for token expiration on component mount and set interval to keep checking
onMounted(() => {
    checkExpiration(); // Initial check on mount
    // fetchUser();
    fetchCards();

    // Set an interval to check every 5 seconds (5000ms)
    intervalId = setInterval(() => {
        checkExpiration();
    }, 5000);

    // Calculate and set a timeout to trigger logout 2 seconds before the token expires
    if (accessToken.value) {
        const logoutTime = calculateAutoLogoutTime(accessToken.value);
        if (logoutTime > 0) {
            // Display a warning message before auto logout
            setTimeout(() => {
                toast.warning("You will be logged out in 2 seconds due to session expiration.", {
                    timeout: 5000 // The warning will disappear after 2 seconds
                });

                // After the warning, trigger the logout
                setTimeout(() => {
                    console.log("Auto-logging out the user...");
                    logout_(); // Call logout function before the token expires
                }, 5000); // The second timeout ensures logout happens after the warning
            }, logoutTime - 5000); // Show the warning 2 seconds before the token expires
        } else {
            console.log("Token is already expired or invalid, logging out immediately.");
            logout_(); // Immediate logout if token is already expired
        }
    }
});

// Stop the interval and timeout when the component is about to unmount or when logged out
onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId); // Clear the interval to stop further checks
    }
    if (logoutTimeout) {
        clearTimeout(logoutTimeout); // Clear the timeout to prevent logout if component is unmounted
    }
});

// Function to logout the user
const logout_ = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error: any) {
        console.log('auto Logout error:');
        // toast.error('Logout failed!');
        toast.error(error.message || 'Logout failed!', {
            timeout: 3000,
        });
    }
};

// Watcher to logout automatically when the token expires
watch(expired, (newVal) => {
    if (newVal) {
        toast.info('Your access token has expired. Please log in again.', { timeout: 2000 });
        logout_(); // Logout the user
    }
});

definePageMeta({
    middleware: ['auth'], // This page requires authentication
})
</script>

<!-- <p v-if="owner">Username: {{ owner.username }}</p>
        <p v-else><Skeleton width="5rem" class="mb-2"></Skeleton></p>
        <p v-if="owner">Email: {{ owner.email }}</p>
        <p v-else><Skeleton width="5rem" class="mb-2"></Skeleton></p> -->

<template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <h1 class="text-2xl font-bold">Owner</h1>
        <div class="space-y-2">
            <div class="flex items-center gap-2">
                <p>Username:</p>
                <span v-if="owner">{{ owner.username }}</span>
                <Skeleton v-else width="5rem"></Skeleton>
            </div>

            <div class="flex items-center gap-2">
                <p>Email:</p>
                <span v-if="owner">{{ owner.email }}</span>
                <Skeleton v-else width="5rem"></Skeleton>
            </div>
        </div>
        <!-- PrimeVue Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" outlined @click="confirmDeleteSelected"
                    :disabled="!selectedCards || !selectedCards.length" />
            </template>

            <template #end>
                <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" customUpload
                    chooseLabel="Import" class="mr-2" auto :chooseButtonProps="{ severity: 'secondary' }" />
                <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <!-- PrimeVue DataTable -->
        <template v-if="loading">
            <div>
                <div class="flex justify-between mb-4">
                    <Skeleton width="8rem" height="3rem"></Skeleton>
                    <Skeleton width="8rem" height="3rem"></Skeleton>
                </div>
                <div class="mb-4">
                    <div class="flex items-center justify-center">
                        <div class="flex gap-14">
                            <Skeleton width="20rem" height="3rem"></Skeleton>
                            <Skeleton width="20rem" height="3rem"></Skeleton>
                            <Skeleton width="20rem" height="3rem"></Skeleton>
                            <Skeleton width="20rem" height="3rem"></Skeleton>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="flex items-center justify-center">
                        <div class="flex gap-14">
                            <Skeleton width="15rem" height="3rem"></Skeleton>
                            <Skeleton width="15rem" height="3rem"></Skeleton>
                            <Skeleton width="15rem" height="3rem"></Skeleton>
                            <Skeleton width="15rem" height="3rem"></Skeleton>
                        </div>
                        <div class="flex gap-2 ml-10">
                            <Skeleton width="3rem" height="3rem" borderRadius="50%"></Skeleton>
                            <Skeleton width="3rem" height="3rem" borderRadius="50%"></Skeleton>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="flex items-center justify-center">
                        <div class="flex gap-14">
                            <Skeleton width="32rem" height="2rem"></Skeleton>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template v-else-if="cards.length === 0">
            <p class=" text-2xl text-center w-full text-gray-500">You haven't created any cards yet.</p>
        </template>

        <template v-else>
            <DataTable ref="dt" v-model:selection="selectedCards" :value="cards" dataKey="id" :paginator="true"
                :rows="5"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cards" :filters="filters">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manage Cards</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <Column selectionMode="multiple" style="width: 3rem"></Column>
                <Column field="id" header="ID" sortable></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="createdAt" header="Created At" sortable></Column>
                <Column field="updatedAt" header="Updated At" sortable></Column>
                <Column field="owner.username" header="Owner">
                    <template #body="slotProps">
                        {{ slotProps.data.owner ? slotProps.data.owner.username : 'N/A' }}
                    </template>
                </Column>
                <Column style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCard(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteCard(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </template>

    </div>
    <ConfirmPopup></ConfirmPopup>
    <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
    <Dialog v-model:visible="loadingLogoutDelete" :modal="true" :closable="false" :dismissableMask="false"
        :showHeader="false">
        <div class="flex flex-col items-center justify-center p-4">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="transparent"
                animationDuration=".5s" aria-label="Custom ProgressSpinner" />
            <p class="mt-4 text-lg font-medium">
                {{ operation === 'logout' ? 'Logging out...' :
                    operation === 'deleteCard' ? 'Deleting card...' :
                        operation === 'deleteSelectedCards' ? 'Deleting selected cards...' : '' }}
            </p>
        </div>
    </Dialog>

    <!-- Dialog for editing/creating card -->
    <Dialog :visible="isDialogVisible" :modal="true" :closable="false" @hide="resetDialog"
        :header="isEditMode ? 'Patch Card Form' : 'Card Form'">
        <!-- Card form -->
        <div class="p-fluid">
            <div class="p-field">
                <label for="cardName" class="mr-2">Card Name</label>
                <InputText id="cardName" v-model="newCard.name" placeholder="Enter card name" />
            </div>
        </div>
        <template #footer>
            <Button :hidden="loadingEditSave" label="Cancel" icon="pi pi-times" @click="resetDialog"
                class="p-button-text" />
            <Button v-if="loadingEditSave">
                <ProgressSpinner style="width: 20px; height: 20px; margin-right: 8px" strokeWidth="8" fill="transparent"
                    animationDuration=".5s" aria-label="" />
                Loading...
            </Button>
            <Button v-else :label="isEditMode ? 'Patch' : 'Save'" icon="pi pi-check" @click="saveCard" />
        </template>
    </Dialog>
</template>

<!-- <Dialog v-model:visible="loadingLogoutDelete" :modal="true" :closable="false" :dismissableMask="false"
        :showHeader="false">
        <div class="flex flex-col items-center justify-center p-4">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="transparent"
                animationDuration=".5s" aria-label="Custom ProgressSpinner" />
            <p class="mt-4 text-lg font-medium">Logging out...</p>
        </div>
    </Dialog> -->



<!-- <div class="mb-4">
    <div class="flex">
        <div class="self-center" style="flex: 1">
            <Skeleton width="100%" class="mb-2"></Skeleton>
            <Skeleton width="75%"></Skeleton>
        </div>
        <Skeleton shape="circle" size="4rem" class="mr-2"></Skeleton>
    </div>
</div>
<div class="flex mb-4">
    <div class="flex">
        <Skeleton width="10rem" class="mb-2"></Skeleton>
        <Skeleton width="5rem" class="mb-2"></Skeleton>
        <Skeleton height=".5rem"></Skeleton>
    </div>
    <Skeleton shape="circle" size="4rem" class="mr-2"></Skeleton>
</div>
<Skeleton width="100%" height="150px"></Skeleton> -->


<!-- <DataTable ref="dt" v-model:selection="selectedCards" :value="cards.length ? cards : Array(3).fill({})"
            dataKey="id" :paginator="true" :rows="10"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cards" :filters="filters">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Manage Cards</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem"></Column>

            <Column field="id" header="ID" sortable>
                <template #body="slotProps">
                    <Skeleton v-if="!cards.length"></Skeleton>
                    <span v-else>{{ slotProps.data.id }}</span>
                </template>
            </Column>

            <Column field="name" header="Name" sortable>
                <template #body="slotProps">
                    <Skeleton v-if="!cards.length"></Skeleton>
                    <span v-else>{{ slotProps.data.name }}</span>
                </template>
            </Column>

            <Column field="createdAt" header="Created At" sortable>
                <template #body="slotProps">
                    <Skeleton v-if="!cards.length"></Skeleton>
                    <span v-else>{{ slotProps.data.createdAt }}</span>
                </template>
            </Column>

            <Column field="updatedAt" header="Updated At" sortable>
                <template #body="slotProps">
                    <Skeleton v-if="!cards.length"></Skeleton>
                    <span v-else>{{ slotProps.data.updatedAt }}</span>
                </template>
            </Column>

            <Column field="owner.username" header="Owner">
                <template #body="slotProps">
                    <Skeleton v-if="!cards.length"></Skeleton>
                    <span v-else>{{ slotProps.data.owner ? slotProps.data.owner.username : 'N/A' }}</span>
                </template>
            </Column>

            <Column style="min-width: 10rem">
                <template #body="slotProps">
                    <div v-if="!cards.length" class="flex gap-2">
                        <Skeleton width="2rem" height="2rem" borderRadius="50%"></Skeleton>
                        <Skeleton width="2rem" height="2rem" borderRadius="50%"></Skeleton>
                    </div>
                    <div v-else>
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCard(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteCard(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable> -->

<!-- <DataTable ref="dt" v-model:selection="selectedCards" :value="!loading && cards.length === 0 ? [] : cards"
            dataKey="id" :paginator="true" :rows="10"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cards" :filters="filters">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Manage Cards</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </IconField>
                </div>
            </template>

            <template v-if="loading">
                <Column v-for="col in ['ID', 'Name', 'Created At', 'Updated At', 'Owner']" :key="col" :header="col">
                    <template #body>
                        <Skeleton width="4rem" height="2rem"></Skeleton>
                    </template>
                </Column>
            </template>

            <template v-else-if="cards.length === 0">
                <p class=" text-2xl text-center w-full text-gray-500">You haven't created any cards yet.</p>
            </template>

            <template v-else>
                <Column selectionMode="multiple" style="width: 3rem"></Column>
                <Column field="id" header="ID" sortable></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="createdAt" header="Created At" sortable></Column>
                <Column field="updatedAt" header="Updated At" sortable></Column>
                <Column field="owner.username" header="Owner">
                    <template #body="slotProps">
                        {{ slotProps.data.owner ? slotProps.data.owner.username : 'N/A' }}
                    </template>
                </Column>
                <Column style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCard(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteCard(slotProps.data)" />
                    </template>
                </Column>
            </template>
        </DataTable> -->



<!-- <DataTable ref="dt" v-model:selection="selectedCards" :value="cards.length ? cards : Array(10).fill({})"
dataKey="id" :paginator="true" :rows="10"
paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
:rowsPerPageOptions="[5, 10, 25]"
currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cards" :filters="filters">
<template #header>
    <div class="flex flex-wrap gap-2 items-center justify-between">
        <h4 class="m-0">Manage Cards</h4>
        <IconField>
            <InputIcon>
                <i class="pi pi-search" />
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Search..." />
        </IconField>
    </div>
</template>

<Column selectionMode="multiple" style="width: 3rem"></Column>

<Column field="id" header="ID" sortable>
    <template #body="slotProps">
        <Skeleton v-if="!cards.length"></Skeleton>
        <span v-else>{{ slotProps.data.id }}</span>
    </template>
</Column>

<Column field="name" header="Name" sortable>
    <template #body="slotProps">
        <Skeleton v-if="!cards.length"></Skeleton>
        <span v-else>{{ slotProps.data.name }}</span>
    </template>
</Column>

<Column field="createdAt" header="Created At" sortable>
    <template #body="slotProps">
        <Skeleton v-if="!cards.length"></Skeleton>
        <span v-else>{{ slotProps.data.createdAt }}</span>
    </template>
</Column>

<Column field="updatedAt" header="Updated At" sortable>
    <template #body="slotProps">
        <Skeleton v-if="!cards.length"></Skeleton>
        <span v-else>{{ slotProps.data.updatedAt }}</span>
    </template>
</Column>

<Column field="owner.username" header="Owner">
    <template #body="slotProps">
        <Skeleton v-if="!cards.length"></Skeleton>
        <span v-else>{{ slotProps.data.owner ? slotProps.data.owner.username : 'N/A' }}</span>
    </template>
</Column>

<Column style="min-width: 10rem">
    <template #body="slotProps">
        <div v-if="!cards.length" class="flex gap-2">
            <Skeleton width="2rem" height="2rem" borderRadius="50%"></Skeleton>
            <Skeleton width="2rem" height="2rem" borderRadius="50%"></Skeleton>
        </div>
        <div v-else>
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCard(slotProps.data)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger"
                @click="confirmDeleteCard(slotProps.data)" />
        </div>
    </template>
</Column>
</DataTable> -->


<!-- <span v-else>{{ slotProps.data.id }}</span> -->
<!-- <span v-else>{{ slotProps.data.name }}</span> -->
<!-- <span v-else>{{ slotProps.data.createdAt }}</span> -->
<!-- <span v-else>{{ slotProps.data.updatedAt }}</span> -->
<!-- <span v-else>{{ slotProps.data.owner ? slotProps.data.owner.username : 'N/A' }}</span> -->

<!-- <DataTable ref="dt" v-model:selection="selectedCards" :value="cards" dataKey="id" :paginator="true" :rows="10"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cards" :filters="filters">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Manage Cards</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem"></Column>
            <Column field="id" header="ID" sortable></Column>
            <Column field="name" header="Name" sortable></Column>
            <Column field="createdAt" header="Created At" sortable></Column>
            <Column field="updatedAt" header="Updated At" sortable></Column>
            <Column field="owner.username" header="Owner">
                <template #body="slotProps">
                    {{ slotProps.data.owner ? slotProps.data.owner.username : 'N/A' }}
                </template>
            </Column>

            <Column style="min-width: 10rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCard(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger"
                        @click="confirmDeleteCard(slotProps.data)" />
                </template>
            </Column>
        </DataTable> -->





<!-- <label for="cardName">Card Name</label>
<Button label="Save" icon="pi pi-check" @click="saveCard" /> -->

<!-- <Dialog v-model:visible="isDialogVisible" header="New Card" modal>
    <div class="p-fluid space-x-3">
        <label for="title">Name</label>
        <InputText id="title" v-model="newCard.name" />
    </div>
    <div class="p-mt-2 mt-4">
        <Button label="Save" @click="saveCard" />
        <Button label="Cancel" @click="isDialogVisible = false" class="p-button-text" />
    </div>
</Dialog> -->


<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <p v-if="user">Username: {{ user.username }}</p>
        <p v-if="user">Email: {{ user.email }}</p>
        <h1 class="text-2xl font-bold">Owner</h1>
        <p v-if="owner">Username: {{ owner.username }}</p>
        <p v-if="owner">Email: {{ owner.email }}</p>
        <div class="p-6">
            <h1 class="text-2xl font-bold mb-4">My Cards</h1>
            <div v-if="loading" class="flex justify-center items-center my-4">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="transparent"
                    animationDuration=".5s" aria-label="Loading..." />
            </div>
            <div v-else>
                <div v-if="cards.length > 0">
                    <ul class="space-y-4">
                        <li v-for="card in cards" :key="card.id" class="p-4 border rounded shadow">
                            <h2 class="text-lg font-semibold">{{ card.name }}</h2>
                            <p class="text-sm text-gray-500">Created at: {{ new Date(card.createdAt).toLocaleString() }}
                            </p>
                        </li>
                    </ul>
                </div>
                <p v-else class="text-gray-500">No cards found.</p>
            </div>
        </div>
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="transparent" animationDuration=".5s"
            aria-label="Loading..." />
        <ProgressSpinner />
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class="ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
import { jwtDecode } from 'jwt-decode';
import api from '@/composables/useAuth'; // Import the API instance
import ProgressSpinner from 'primevue/progressspinner';

const confirm = useConfirm();
const router = useRouter();
const toast = useToast();
const { logout, checkTokens } = useAuth();

// Define the Card Type
interface Card {
    id: string
    name: string
    createdAt: string
}

interface Owner {
    username: string
    email: string
}

// Explicitly type the ref
const cards = ref<Card[]>([])
const owner = ref<Owner | null>(null)

const loading = ref(true); // Track loading state

// Reactive token variable
const accessToken = useCookie('accessToken');
const expired = ref(false);

const user = ref<{ username: string; email: string } | null>(null);

// Fetch user details
const fetchUser = async () => {
    try {
        const { data } = await api.get('/api/me', {
            headers: { Authorization: `Bearer ${useCookie('accessToken').value}` }
        });
        user.value = data;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to load user data.");
    }
};

const fetchCards = async () => {
    loading.value = true; // Start loading
    console.log("under loading.value = true; // Start loading")
    try {
        const response = await api.get('/api/cards', {
            headers: {
                Authorization: `Bearer ${useCookie('accessToken').value}`,
                'Accept': 'application/json'
            }
        })
        console.log("test response = ", response);
        console.log("test response = ", response.data.cards);
        console.log("test owner = ", response.data.owner);
        cards.value = response.data.cards;
        owner.value = response.data.owner;
    } catch (error) {
        console.error('Error fetching cards:', error)
    } finally {
        loading.value = false; // Hide spinner after fetching data
    }
}

const onSubmit = () => {
    toast.error('Hello World!');
}

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        const checkTime = decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Function to check token validity and expire status
const checkExpiration = () => {
    if (isTokenExpired(accessToken.value!)) {
        console.log('Access token expired.');
        expired.value = true;
    } else {
        expired.value = false;
    }
};

// Declare the interval variable with the correct type
let intervalId: ReturnType<typeof setInterval>;

// Declare the timeout variable for auto-logout
let logoutTimeout: ReturnType<typeof setTimeout> | null = null;

// Function to calculate the auto logout time (2-3 seconds before expiration)
const calculateAutoLogoutTime = (token: string) => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        // Subtract 2 seconds from the expiration time (you can adjust this to 3 seconds if needed)
        return decoded.exp * 1000 - Date.now() - 2000; // 2000ms = 2 seconds before expiration
    } catch (error) {
        console.error('Error decoding token:', error);
        return 0; // Default to immediate logout if token decoding fails
    }
};

// Check for token expiration on component mount and set interval to keep checking
onMounted(() => {
    checkExpiration(); // Initial check on mount
    fetchUser();
    fetchCards();

    // Set an interval to check every 5 seconds (5000ms)
    intervalId = setInterval(() => {
        checkExpiration();
    }, 5000);

    // Calculate and set a timeout to trigger logout 2 seconds before the token expires
    if (accessToken.value) {
        const logoutTime = calculateAutoLogoutTime(accessToken.value);
        if (logoutTime > 0) {
            // Display a warning message before auto logout
            setTimeout(() => {
                toast.warning("You will be logged out in 2 seconds due to session expiration.", {
                    timeout: 5000 // The warning will disappear after 2 seconds
                });

                // After the warning, trigger the logout
                setTimeout(() => {
                    console.log("Auto-logging out the user...");
                    logout_(); // Call logout function before the token expires
                }, 5000); // The second timeout ensures logout happens after the warning
            }, logoutTime - 5000); // Show the warning 2 seconds before the token expires
        } else {
            console.log("Token is already expired or invalid, logging out immediately.");
            logout_(); // Immediate logout if token is already expired
        }
    }
});

// Stop the interval and timeout when the component is about to unmount or when logged out
onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId); // Clear the interval to stop further checks
    }
    if (logoutTimeout) {
        clearTimeout(logoutTimeout); // Clear the timeout to prevent logout if component is unmounted
    }
});

// Function to logout the user
const logout_ = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error: any) {
        console.log('auto Logout error:');
        // toast.error('Logout failed!');
        toast.error(error.message || 'Logout failed!', {
            timeout: 3000,
        });
    }
};

// Confirm logout
const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            // await logout_();
            await onLogout();
        },
    });
};

// On manual logout
const onLogout = async () => {
    try {
        console.log("in onLogout");
        await logout();
        navigateTo('/login');
    } catch (error: any) {
        console.log('manual Logout error:');
        // toast.error('Logout failed!');
        toast.error(error.message || 'Logout failed!', {
            timeout: 3000,
        });
    }
};

// Watcher to logout automatically when the token expires
watch(expired, (newVal) => {
    if (newVal) {
        toast.info('Your access token has expired. Please log in again.', { timeout: 2000 });
        logout_(); // Logout the user
    }
});

definePageMeta({
    middleware: ['auth'], // This page requires authentication
})
</script> -->


<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class="ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
import { jwtDecode } from 'jwt-decode';

const confirm = useConfirm();
const router = useRouter();
const toast = useToast();
const { logout, checkTokens } = useAuth();

// Reactive token variable
const accessToken = useCookie('accessToken');
const expired = ref(false);

const onSubmit = () => {
    toast.error('Hello World!');
}

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        const checkTime = decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Function to check token validity and expire status
const checkExpiration = () => {
    if (isTokenExpired(accessToken.value!)) {
        console.log('Access token expired.');
        expired.value = true;
    } else {
        expired.value = false;
    }
};

// Declare the interval variable with the correct type
let intervalId: ReturnType<typeof setInterval>;

// Declare the timeout variable for auto-logout
let logoutTimeout: ReturnType<typeof setTimeout> | null = null;

// Function to calculate the auto logout time (2-3 seconds before expiration)
const calculateAutoLogoutTime = (token: string) => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        // Subtract 2 seconds from the expiration time (you can adjust this to 3 seconds if needed)
        return decoded.exp * 1000 - Date.now() - 2000; // 2000ms = 2 seconds before expiration
    } catch (error) {
        console.error('Error decoding token:', error);
        return 0; // Default to immediate logout if token decoding fails
    }
};

// Check for token expiration on component mount and set interval to keep checking
onMounted(() => {
    console.log("Inside onMounted")
    checkExpiration(); // Initial check on mount

    // Set an interval to check every 5 seconds (5000ms)
    intervalId = setInterval(() => {
        checkExpiration();
    }, 5000);

    // Calculate and set a timeout to trigger logout 2 seconds before the token expires
    if (accessToken.value) {
        const logoutTime = calculateAutoLogoutTime(accessToken.value);
        // if (logoutTime > 0) {
        //     logoutTimeout = setTimeout(() => {
        //         console.log("Auto-logging out the user...");
        //         logout_(); // Call logout function before the token expires
        //     }, logoutTime);
        if (logoutTime > 0) {
            // Display a warning message before auto logout
            setTimeout(() => {
                toast.warning("You will be logged out in 2 seconds due to session expiration.", {
                    timeout: 5000 // The warning will disappear after 2 seconds
                });

                // After the warning, trigger the logout
                setTimeout(() => {
                    console.log("Auto-logging out the user...");
                    logout_(); // Call logout function before the token expires
                }, 5000); // The second timeout ensures logout happens after the warning
            }, logoutTime - 5000); // Show the warning 2 seconds before the token expires
        } else {
            console.log("Token is already expired or invalid, logging out immediately.");
            logout_(); // Immediate logout if token is already expired
        }
    }
});

// Stop the interval and timeout when the component is about to unmount or when logged out
onBeforeUnmount(() => {
    console.log("inside onBeforeUnmount")
    if (intervalId) {
        clearInterval(intervalId); // Clear the interval to stop further checks
    }
    if (logoutTimeout) {
        clearTimeout(logoutTimeout); // Clear the timeout to prevent logout if component is unmounted
    }
});

// Function to logout the user
const logout_ = async () => {
    console.log("inside logout_")
    try {
        await logout();
        navigateTo('/login');
    } catch (error: any) {
        console.log('auto Logout error:');
        // toast.error('Logout failed!');
        toast.error(error.message || 'Logout failed!', {
            timeout: 3000,
        });
    }
    // } catch (error) {
    //     console.error("Logout error:", error);
    // }
};

// Confirm logout
const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            // await logout_();
            await onLogout();
        },
    });
};

// On manual logout
const onLogout = async () => {
    console.log("inside onLogout")
    try {
        console.log("in onLogout");
        await logout();
        navigateTo('/login');
    } catch (error: any) {
        console.log('manual Logout error:');
        // toast.error('Logout failed!');
        toast.error(error.message || 'Logout failed!', {
            timeout: 3000,
        });
    }
};

// Watcher to logout automatically when the token expires
watch(expired, (newVal) => {
    if (newVal) {
        console.log("inside watch")
        toast.info('Your access token has expired. Please log in again.', { timeout: 2000 });
        logout_(); // Logout the user
        // setTimeout(() => {
        //     // navigateTo('/');
        //     logout_(); // Logout the user
        // }, 2000);
    }
});

console.log("upper definePageMeta");
definePageMeta({
  middleware: ['auth'], // This page requires authentication
})
console.log("under definePageMeta");
</script> -->


<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class="ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
import { jwtDecode } from 'jwt-decode';

const confirm = useConfirm();
const router = useRouter();
const toast = useToast();
const { logout, checkTokens } = useAuth();

// Reactive token variable
const accessToken = useCookie('accessToken');
const expired = ref(false);

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        const checkTime = decoded.exp * 1000 < Date.now();
        // return decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Function to check token validity and expire status
const checkExpiration = () => {
    if (isTokenExpired(accessToken.value!)) {
        console.log('Access token expired.');
        expired.value = true;
    } else {
        expired.value = false;
    }
};

// Declare the interval variable with the correct type
let intervalId: ReturnType<typeof setInterval>;

// Check for token expiration on component mount and set interval to keep checking
onMounted(() => {
    checkExpiration(); // Initial check on mount

    // Set an interval to check every 5 seconds (5000ms)
    intervalId = setInterval(() => {
        checkExpiration();
    }, 5000);
});

// Stop the interval when the component is about to unmount or when logged out
onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId); // Clear the interval to stop further checks
    }
});


// Function to logout the user
const logout_ = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error("Logout error:", error);
    }
};

// Confirm logout
const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            await logout_();
        },
    });
};

// On manual logout
const onLogout = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed!');
    }
};

// Watcher to logout automatically when the token expires
watch(expired, (newVal) => {
    if (newVal) {
        toast.error('Your access token has expired. Please log in again.', { timeout: 5000 });
        logout_(); // Logout the user
    }
});
</script> -->

<!-- const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        const de1 = decoded.exp * 1000;
        console.log("de1", de1);
        const dn = Date.now();
        console.log("dn", dn);
        const checkTime = de1 < dn;
        // const checkTime = decoded.exp * 1000 < Date.now();
        // return decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
}; -->


<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class="ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
// import { useCookie } from 'vue-cookie-next';
import { jwtDecode } from 'jwt-decode';

const confirm = useConfirm();
const router = useRouter();
const toast = useToast();
const { logout, checkTokens } = useAuth();

// Reactive token variable
const accessToken = useCookie('accessToken');
const expired = ref(false);

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        return decoded.exp * 1000 < Date.now();
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Function to check token validity and expire status
const checkExpiration = () => {
    // if (accessToken.value && isTokenExpired(accessToken.value)) {
    if (isTokenExpired(accessToken.value!)) {
        console.log('Access token expired.');
        expired.value = true;
    } else {
        expired.value = false;
    }
};

// Declare the interval variable to clear it later
let intervalId: number;

// Check for token expiration on component mount and set interval to keep checking
onMounted(() => {
    checkExpiration(); // Initial check on mount

    // Set an interval to check every minute
    setInterval(() => {
        checkExpiration();
    }, 5000); // Set an interval to check every 5 seconds (5000ms)
    // setInterval(() => {
    //     checkExpiration();
    // }, 60000); // 60000ms = 1 minute
});

// Stop the interval when the component is about to unmount or when logged out
onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId); // Clear the interval to stop further checks
    }
});

// Function to logout the user
const logout_ = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error("Logout error:", error);
    }
};

// Confirm logout
const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            await logout_();
        },
    });
};

// On manual logout
const onLogout = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed!');
    }
};

// Watcher to logout automatically when the token expires
watch(expired, (newVal) => {
    if (newVal) {
        toast.error('Your access token has expired. Please log in again.', { timeout: 5000 });
        logout_(); // Logout the user
    }
});
</script> -->



<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class="ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";

import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    exp: number; // Expiration time in seconds since epoch
    [key: string]: any; // Other optional fields in the payload
}

const confirm = useConfirm();
const router = useRouter();

const toast = useToast();
const { logout, checkTokens } = useAuth();

const onSubmit = () => {
    toast.error('Hello world!');
};

const logout_ = async () => {
    try {
        await logout();
        console.log("Logging out...");
        navigateTo('/login');
    } catch (error) {
        console.error("Logout error:", error);
    }
};

const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            await logout_();
        },
    });
};

const onLogout = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed!');
    }
};

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: JwtPayload = jwtDecode(token);
        const checkTime = decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
        // return decoded.exp * 1000 < Date.now();
    } catch (error) {
        // console.error('Error decoding token:', error);
        return true;
    }
};

// Check for token expiration on component mount
onMounted(async () => {
    const accessToken = useCookie('accessToken').value;
    console.log("enter onMounted");
    console.log("under enter onMounted ", isTokenExpired(accessToken!));

    // const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    // if (accessToken && isTokenExpired(accessToken)) {
    if (isTokenExpired(accessToken!)) {
        console.log('Access token expired.');
        // Access token expired, try refreshing
        try {
            console.log('under try');
            // await logout();
            // navigateTo('/login');
        } catch (error) {
            console.error('Error refreshing access token:', error);
            return true; // Session expired if refresh fails
        }
    }
});
</script> -->

<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class="ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";

import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    exp: number; // Expiration time in seconds since epoch
    [key: string]: any; // Other optional fields in the payload
}

const confirm = useConfirm();
const router = useRouter();

const toast = useToast();
const { logout, checkTokens } = useAuth();

const onSubmit = () => {
    toast.error('Hello world!');
};

const logout_ = async () => {
    try {
        await logout();
        console.log("Logging out...");
        navigateTo('/login');
    } catch (error) {
        console.error("Logout error:", error);
    }
};

const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            await logout_();
        },
    });
};

const onLogout = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed!');
    }
};

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: JwtPayload = jwtDecode(token);
        const checkTime = decoded.exp * 1000 < Date.now();
        console.log("checkTime", checkTime);
        return checkTime;
        // return decoded.exp * 1000 < Date.now();
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Check for token expiration on component mount
onMounted(async () => {
    const accessToken = useCookie('accessToken').value;
    console.log("enter onMounted");
    console.log("under enter onMounted ", isTokenExpired(accessToken!));

    // const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    // if (accessToken && isTokenExpired(accessToken)) {
    if (isTokenExpired(accessToken!)) {
        console.log('Access token expired.');
        // Access token expired, try refreshing
        try {
            console.log('under try');
            await logout();
            navigateTo('/login');
            // await refreshToken_(); // Attempt to refresh the access token
            // return false; // Token successfully refreshed
        } catch (error) {
            console.error('Error refreshing access token:', error);
            return true; // Session expired if refresh fails
        }
    }

    // if (!accessToken) {
    //     console.log("enter !accessToken");
    //     await logout();
    //     navigateTo('/login');
    //     return;
    // }

    // const isExpired = await checkTokens();
    // if (isExpired) {
    //     console.log("enter isExpired");
    //     toast.error('Your access token has expired. Please log in again.', { timeout: 5000 });
    //     await logout();
    //     navigateTo('/login');
    // }
});
</script> -->


<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class=" ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification'
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";

const confirm = useConfirm();
const router = useRouter();

const toast = useToast()
const { logout, checkTokens } = useAuth();
const accessToken = useCookie('accessToken').value;

const onSubmit = () => {
    // use the toast notification plugin to show a success message
    // toast.success('Hello world!')
    toast.error('Hello world!')
}

const logout_ = async () => {
    try {
        // Call your logout API
        // console.log("Logging out...");
        // await navigateTo("/login"); // Redirect to login page
        await logout();
        console.log("Logging out...");
        navigateTo('/login');
    } catch (error) {
        console.error("Logout error:", error);
    }
};

const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement, // Ensure the correct type
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            await logout_();
        },
    });
};

const onLogout = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Hello world!')
    }
};

if (!accessToken) {
    // toast.error('Your access token has expired. Please log in again.', {
    //     timeout: 5000,
    // });
    await logout();
    navigateTo('/login');
} else {
    // Check token validity
    const isExpired = await checkTokens();
    if (isExpired) {
        toast.error('Your access token has expired. Please log in again.', {
            timeout: 5000,
        });
        await logout();
        navigateTo('/login');
    }
}
</script> -->


<!-- <template>
    <div>
        <h1 class="text-2xl font-bold">Welcome to the Homepage!</h1>
        <p>Access token is refreshed automatically when needed.</p>
        <ConfirmPopup></ConfirmPopup>
        <Button @click="confirmLogout($event)" label="Logout" severity="danger" outlined></Button>
        <Button label="Logout" class="mt-5 ml-3" @click="onLogout" />
        <Button @click="onSubmit" class=" ml-3">Click</Button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'vue-toastification'
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";

const confirm = useConfirm();
const router = useRouter();

const toast = useToast()
const { logout, checkTokens } = useAuth();
const accessToken = useCookie('accessToken').value;

const onSubmit = () => {
    // use the toast notification plugin to show a success message
    // toast.success('Hello world!')
    toast.error('Hello world!')
}

const logout_ = async () => {
    try {
        // Call your logout API
        // console.log("Logging out...");
        // await navigateTo("/login"); // Redirect to login page
        await logout();
        console.log("Logging out...");
        navigateTo('/login');
    } catch (error) {
        console.error("Logout error:", error);
    }
};

const confirmLogout = (event: MouseEvent) => {
    confirm.require({
        target: event.currentTarget as HTMLElement, // Ensure the correct type
        message: "Are you sure you want to log out?",
        header: "Logout Confirmation",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Logout",
        rejectLabel: "Cancel",
        accept: async () => {
            await logout_();
        },
    });
};

const onLogout = async () => {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Hello world!')
    }
};

if (!accessToken) {
    // toast.error('Your access token has expired. Please log in again.', {
    //     timeout: 5000,
    // });
    await logout();
    navigateTo('/login');
} else {
    // Check token validity
    const isExpired = await checkTokens();
    if (isExpired) {
        toast.error('Your access token has expired. Please log in again.', {
            timeout: 5000,
        });
        await logout();
        navigateTo('/login');
    }
    // const checkAndHandleToken = async () => {
    //     const isExpired = await checkTokens();
    //     if (isExpired) {
    //         toast.error('Your access token has expired. Please log in again.', {
    //             timeout: 5000,
    //         });
    //         await logout();
    //         router.push('/login');
    //     }
    // };

    // onMounted(() => {
    //     // Run the check every 5 minutes (adjust as needed)
    //     const interval = setInterval(checkAndHandleToken, 5000);

    //     // Cleanup when component unmounts
    //     onUnmounted(() => clearInterval(interval));
    // });
}
</script> -->