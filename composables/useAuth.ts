import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    exp: number; // Expiration time in seconds since epoch
    [key: string]: any; // Other optional fields in the payload
}

const api = axios.create({
    // baseURL: 'http://localhost:8000',
    baseURL: import.meta.env.VITE_BASE_URL,
    withCredentials: true,
});

console.log("check env api = ", import.meta.env.VITE_BASE_URL);

// Decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.exp * 1000 < Date.now();
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

// Refresh token function
const refreshToken_ = async () => {
    try {
        const { data } = await api.post('/refresh-token', {
            refreshToken: Cookies.get('refreshToken'),
        });

        if (data.accessToken) {
            const decodedToken = jwtDecode<JwtPayload>(data.accessToken);
            if (decodedToken.exp) {
                Cookies.set('accessToken', data.accessToken, {
                    secure: true,
                    sameSite: 'Strict',
                    expires: new Date(decodedToken.exp * 1000),
                });
            } else {
                console.error('Token does not have an exp field');
            }
        }

        if (data.refreshToken) {
            Cookies.set('refreshToken', data.refreshToken, {
                secure: true,
                sameSite: 'Strict',
                expires: 30, // 30 days
            });
        }

        return data.accessToken;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

// Authentication Composable
export const useAuth = () => {
    const checkTokens = async (): Promise<boolean> => {
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');

        if (accessToken && isTokenExpired(accessToken)) {
            console.log('Access token expired.');
            // Access token expired, try refreshing
            try {
                // navigateTo('/login');
                await refreshToken_(); // Attempt to refresh the access token
                return false; // Token successfully refreshed
            } catch (error) {
                console.error('Error refreshing access token:', error);
                return true; // Session expired if refresh fails
            }
        }

        if (!accessToken && refreshToken && isTokenExpired(refreshToken)) {
            // Handle expired refresh token
            console.error('Refresh token expired.');
            return true; // Session expired
        }

        return false; // Tokens are valid
    };

    const login = async (usernameOrEmail: string, password: string) => {
        try {
            const { data } = await api.post('/login', { usernameOrEmail, password });
            const { accessToken, refreshToken } = data;

            if (data.accessToken) {
                const decodedToken = jwtDecode<JwtPayload>(data.accessToken);
                if (decodedToken.exp) {
                    const expirationTime = new Date(decodedToken.exp * 1000); // Convert seconds to milliseconds
                    console.log("Access token expires at:", expirationTime.toLocaleString());
                    Cookies.set('accessToken', data.accessToken, {
                        secure: true,
                        sameSite: 'Strict',
                        expires: new Date(decodedToken.exp * 1000),
                    });
                } else {
                    console.error('Token does not have an exp field');
                }
            }

            if (refreshToken) {
                // Cookies.set('refreshToken', refreshToken, {
                //     secure: true,
                //     sameSite: 'Strict',
                //     expires: 30, // 30 days
                // });
            }

            return data;
        } catch (error: any) {
            console.error("API error for login:", error);
            throw new Error(error.response?.data?.message || 'An unexpected error occurred.');
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            await api.post('/register', { username, email, password });
        } catch (error: any) {
            console.error("API error:", error);
            throw new Error(error.response?.data?.message || 'An unexpected error occurred.');
        }
    };

    const logout = async () => {
        console.log('enter logout')
        try {
            console.log('under try enter logout')
            await api.post('/logout', {}, {
                headers: { Authorization: `Bearer ${Cookies.get('accessToken')}` },
            });

            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            navigateTo('/login');
        } catch (error: any) {
            if (error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            console.error("API error:", error);
            throw new Error(error.response?.data?.message || 'An unexpected error occurred.');
        }
        // } catch (error) {
        //     console.error('Logout failed:', error);
        // }
    };

    return { login, register, logout, checkTokens, refreshToken_ };
};

export default api;


// //! Below code is 
// import axios from 'axios';
// import Cookies from 'js-cookie';
// // import jwtDecode from 'jwt-decode'; // Install with `pnpm add jwt-decode`
// import { jwtDecode } from 'jwt-decode';

// interface JwtPayload {
//     exp: number; // Expiration time in seconds since epoch
//     [key: string]: any; // Other optional fields in the payload
// }

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true,
// });

// // Decode JWT and check expiration
// const isTokenExpired = (token: string): boolean => {
//     try {
//         const decoded: { exp: number } = jwtDecode(token);
//         return decoded.exp * 1000 < Date.now();
//     } catch (error) {
//         console.error('Error decoding token:', error);
//         return true;
//     }
// };

// // Refresh token function
// const refreshToken_ = async () => {
//     try {
//         const { data } = await api.post('/refresh-token', {
//             refreshToken: Cookies.get('refreshToken'),
//         });

//         if (data.accessToken) {
//             const decodedToken = jwtDecode<JwtPayload>(data.accessToken);

//             if (decodedToken.exp) {
//                 Cookies.set('accessToken', data.accessToken, {
//                     secure: true,
//                     sameSite: 'Strict',
//                     expires: new Date(decodedToken.exp * 1000), // Convert seconds to milliseconds
//                 });
//             } else {
//                 console.error('Token does not have an exp field');
//             }
//         }

//         if (data.refreshToken) {
//             Cookies.set('refreshToken', data.refreshToken, {
//                 secure: true,
//                 sameSite: 'Strict',
//                 expires: 30, // 30 days
//             });
//         }

//         return data.accessToken;
//     } catch (error) {
//         console.error('Error refreshing token:', error);
//         throw error;
//     }
// };

// // Authentication Composable
// export const useAuth = () => {
//     const checkTokens = async (): Promise<boolean> => {
//         const accessToken = Cookies.get('accessToken');
//         const refreshToken = Cookies.get('refreshToken');

//         if (accessToken && isTokenExpired(accessToken)) {
//             // Handle expired access token
//             try {
//                 await refreshToken_(); // Your refresh token logic here
//                 return false; // Token successfully refreshed
//             } catch (error) {
//                 console.error('Error refreshing access token:', error);
//                 return true; // Expired if refresh fails
//             }
//         }

//         if (!accessToken && refreshToken && isTokenExpired(refreshToken)) {
//             // Handle expired refresh token
//             console.error('Refresh token expired.');
//             return true; // Session expired
//         }

//         return false; // Tokens are valid
//     };

//     const login = async (usernameOrEmail: string, password: string) => {
//         try {
//             const { data } = await api.post('/login', { usernameOrEmail, password });
//             const { accessToken, refreshToken } = data;

//             if (data.accessToken) {
//                 const decodedToken = jwtDecode<JwtPayload>(data.accessToken);

//                 if (decodedToken.exp) {
//                     const expirationTime = new Date(decodedToken.exp * 1000); // Convert seconds to milliseconds
//                     console.log("Access token expires at:", expirationTime.toLocaleString());

//                     Cookies.set('accessToken', data.accessToken, {
//                         secure: true,
//                         sameSite: 'Strict',
//                         // expires: new Date(decodedToken.exp * 1000), // Convert seconds to milliseconds
//                         expires: expirationTime, // Convert seconds to milliseconds
//                     });
//                 } else {
//                     console.error('Token does not have an exp field');
//                 }
//             }

//             if (refreshToken) {
//                 Cookies.set('refreshToken', refreshToken, {
//                     secure: true,
//                     sameSite: 'Strict',
//                     expires: 30, // 30 days
//                 });
//             }

//             return data;
//         } catch (error: any) {
//             console.error("API error for login = ", error.response.data.message);
//             console.error("API error for login = ", error);

//             if (error.response.data.message) {
//                 throw new Error(error.response.data.message);
//             }

//             throw new Error("An unexpected error occurred.");
//         }
//     };

//     const register = async (username: string, email: string, password: string) => {
//         // return await api.post('/register', { username, email, password });
//         try {
//             await api.post('/register', { username, email, password });
//         } catch (error: any) {
//             // console.error('Logout failed:', error);
//             console.error("API error:", error);
//             console.error("API error:", error.response.data.message);

//             // If error has a response message, throw a new error with the message
//             if (error.response.data.message) {
//                 throw new Error(error.response.data.message);
//             }

//             throw new Error("An unexpected error occurred.");
//             // throw new Error(error.data.message);
//             // throw new Error(error.response.data.message);
//         }
//     };

//     const logout = async () => {
//         try {
//             await api.post('/logout', {}, {
//                 headers: { Authorization: `Bearer ${Cookies.get('accessToken')}` },
//             });

//             Cookies.remove('accessToken');
//             Cookies.remove('refreshToken');
//             navigateTo('/login');
//         } catch (error) {
//             console.error('Logout failed:', error);
//         }
//     };

//     return { login, register, logout, checkTokens };
// };

// export default api;

// //! Below code is 
// import axios from 'axios';
// import Cookies from 'js-cookie';
// // import jwtDecode from 'jwt-decode'; // Install with `pnpm add jwt-decode`
// import { jwtDecode } from 'jwt-decode';

// interface JwtPayload {
//     exp: number; // Expiration time in seconds since epoch
//     [key: string]: any; // Other optional fields in the payload
// }

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true,
// });

// // Decode JWT and check expiration
// const isTokenExpired = (token: string): boolean => {
//     try {
//         const decoded: { exp: number } = jwtDecode(token);
//         return decoded.exp * 1000 < Date.now();
//     } catch (error) {
//         console.error('Error decoding token:', error);
//         return true;
//     }
// };

// // Refresh token function
// const refreshToken_ = async () => {
//     try {
//         const { data } = await api.post('/refresh-token', {
//             refreshToken: Cookies.get('refreshToken'),
//         });

//         // Save the new tokens
//         // if (data.accessToken) {
//         //     Cookies.set('accessToken', data.accessToken, {
//         //         secure: true,
//         //         sameSite: 'Strict',
//         //         expires: new Date(jwtDecode(data.accessToken).exp * 1000),
//         //     });
//         // }
//         if (data.accessToken) {
//             const decodedToken = jwtDecode<JwtPayload>(data.accessToken);

//             if (decodedToken.exp) {
//                 Cookies.set('accessToken', data.accessToken, {
//                     secure: true,
//                     sameSite: 'Strict',
//                     expires: new Date(decodedToken.exp * 1000), // Convert seconds to milliseconds
//                 });
//             } else {
//                 console.error('Token does not have an exp field');
//             }
//         }

//         if (data.refreshToken) {
//             Cookies.set('refreshToken', data.refreshToken, {
//                 secure: true,
//                 sameSite: 'Strict',
//                 expires: 30, // 30 days
//             });
//         }

//         return data.accessToken;
//     } catch (error) {
//         console.error('Error refreshing token:', error);
//         throw error;
//     }
// };

// // Authentication Composable
// export const useAuth = () => {
//     const checkTokens = async (): Promise<boolean> => {
//         const accessToken = Cookies.get('accessToken');
//         const refreshToken = Cookies.get('refreshToken');

//         // if (!accessToken && !refreshToken) {
//         //     console.error('No tokens found. Logging out.');
//         //     return true; // Treat as expired
//         // }

//         if (accessToken && isTokenExpired(accessToken)) {
//             // Handle expired access token
//             try {
//                 await refreshToken_(); // Your refresh token logic here
//                 return false; // Token successfully refreshed
//             } catch (error) {
//                 console.error('Error refreshing access token:', error);
//                 return true; // Expired if refresh fails
//             }
//         }

//         if (!accessToken && refreshToken && isTokenExpired(refreshToken)) {
//             // Handle expired refresh token
//             console.error('Refresh token expired.');
//             return true; // Session expired
//         }

//         return false; // Tokens are valid
//     };
//     // const checkTokens = async () => {
//     //     const accessToken = Cookies.get('accessToken');
//     //     const refreshToken = Cookies.get('refreshToken');

//     //     if (accessToken && isTokenExpired(accessToken)) {
//     //         // Handle expired access token
//     //         try {
//     //             await refreshToken_();
//     //         } catch (error) {
//     //             alert('Your access token has expired. Please log in again.');
//     //             logout();
//     //         }
//     //     }

//     //     if (!accessToken && refreshToken && isTokenExpired(refreshToken)) {
//     //         // Handle expired refresh token
//     //         alert('Your session has expired. Please log in again.');
//     //         logout();
//     //     }
//     // };

//     const login = async (usernameOrEmail: string, password: string) => {
//         try {
//             const { data } = await api.post('/login', { usernameOrEmail, password });
//             const { accessToken, refreshToken } = data;

//             // Save tokens in cookies
//             // if (accessToken) {
//             //     Cookies.set('accessToken', accessToken, {
//             //         secure: true,
//             //         sameSite: 'Strict',
//             //         expires: new Date(jwtDecode(accessToken).exp * 1000),
//             //     });
//             // }
//             if (data.accessToken) {
//                 const decodedToken = jwtDecode<JwtPayload>(data.accessToken);

//                 if (decodedToken.exp) {
//                     const expirationTime = new Date(decodedToken.exp * 1000); // Convert seconds to milliseconds
//                     console.log("Access token expires at:", expirationTime.toLocaleString());

//                     Cookies.set('accessToken', data.accessToken, {
//                         secure: true,
//                         sameSite: 'Strict',
//                         // expires: new Date(decodedToken.exp * 1000), // Convert seconds to milliseconds
//                         expires: expirationTime, // Convert seconds to milliseconds
//                     });
//                 } else {
//                     console.error('Token does not have an exp field');
//                 }
//             }

//             if (refreshToken) {
//                 Cookies.set('refreshToken', refreshToken, {
//                     secure: true,
//                     sameSite: 'Strict',
//                     expires: 30, // 30 days
//                 });
//             }

//             return data;
//         } catch (error: any) {
//             console.error("API error for login = ", error.response.data.message);
//             console.error("API error for login = ", error);

//             if (error.response.data.message) {
//                 throw new Error(error.response.data.message);
//             }

//             throw new Error("An unexpected error occurred.");
//         }
//     };

//     // const register = async (username: string, email: string, password: string) => {
//     //     return await api.post('/register', { username, email, password });
//     // };
//     const register = async (username: string, email: string, password: string) => {
//         // return await api.post('/register', { username, email, password });
//         try {
//             await api.post('/register', { username, email, password });
//         } catch (error: any) {
//             // console.error('Logout failed:', error);
//             console.error("API error:", error);
//             console.error("API error:", error.response.data.message);

//             // If error has a response message, throw a new error with the message
//             if (error.response.data.message) {
//                 throw new Error(error.response.data.message);
//             }

//             throw new Error("An unexpected error occurred.");
//             // throw new Error(error.data.message);
//             // throw new Error(error.response.data.message);
//         }
//     };
//     // const register = async (username: string, email: string, password: string) => {
//     //     try {
//     //         const response = await $fetch('/register', {
//     //             method: 'POST',
//     //             body: { username, email, password },
//     //             throwHttpErrors: true, // Ensure errors are thrown for non-2xx responses
//     //         });
//     //         return response;
//     //     } catch (error: any) {
//     //         console.error("API error:", error);

//     //         // If error has a response message, throw a new error with the message
//     //         if (error?.data?.message) {
//     //             throw new Error(error.data.message);
//     //         }

//     //         throw new Error("An unexpected error occurred.");
//     //     }
//     // };

//     const logout = async () => {
//         try {
//             await api.post('/logout', {}, {
//                 headers: { Authorization: `Bearer ${Cookies.get('accessToken')}` },
//             });

//             Cookies.remove('accessToken');
//             Cookies.remove('refreshToken');
//             navigateTo('/login');
//         } catch (error) {
//             console.error('Logout failed:', error);
//         }
//     };

//     return { login, register, logout, checkTokens };
// };

// export default api;

//! below code is good but without auto log the user out when acccess token expires
// import axios from 'axios';
// import Cookies from 'js-cookie';

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true, // Ensures cookies are sent with requests
// });

// let accessToken: string | null = Cookies.get('accessToken') || null;

// // Refresh token function
// const refreshToken = async () => {
//     try {
//         const { data } = await api.post('/refresh-token', {
//             refreshToken: Cookies.get('refreshToken'),
//         });
//         // Save the new access token in cookies
//         Cookies.set('accessToken', data.accessToken, {
//             secure: true,
//             sameSite: 'Strict',
//             expires: 1 / 24, // Expire in 1 hour or as per your access token lifespan
//             // expires: 30 / 86400,  // 30 seconds
//         });
//         return data.accessToken;
//     } catch (error) {
//         console.error('Error refreshing token:', error);
//         throw error;
//     }
// };

// // Axios request interceptor
// api.interceptors.request.use(
//     async (config) => {
//         const accessToken = Cookies.get('accessToken');
//         if (accessToken) {
//             config.headers['Authorization'] = `Bearer ${accessToken}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// // Axios response interceptor to handle expired access tokens
// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         // Check if the error is due to expired access token
//         if (
//             error.response?.status === 401 &&
//             !originalRequest._retry &&
//             Cookies.get('refreshToken')
//         ) {
//             originalRequest._retry = true;
//             try {
//                 const newAccessToken = await refreshToken();
//                 // Retry the original request with the new access token
//                 originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 console.error('Refresh token failed:', refreshError);
//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// // Authentication Composable
// export const useAuth = () => {
//     const login = async (usernameOrEmail: string, password: string) => {
//         const { data } = await api.post('/login', { usernameOrEmail, password });
//         console.log('data = ', data);
//         // accessToken = data.accessToken;
//         const { accessToken, refreshToken } = data;

//         if (accessToken) {
//             Cookies.set('accessToken', accessToken, {
//                 secure: true,
//                 sameSite: 'Strict',
//                 expires: 1 / 24, // 1 hour
//                 // expires: 30 / 86400,  // 30 seconds
//             });
//         }

//         if (refreshToken) {
//             Cookies.set('refreshToken', refreshToken, {
//                 secure: true,
//                 sameSite: 'Strict',
//                 expires: 7, // 7 days
//             });
//         }

//         return data;
//     };

//     const register = async (username: string, email: string, password: string) => {
//         return await api.post('/register', { username, email, password });
//     };

//     const logout = async () => {
//         try {
//             const accessToken = Cookies.get('accessToken');
//             await api.post('/logout', {}, { headers: { Authorization: `Bearer ${accessToken}` } });

//             // Clear cookies and state
//             Cookies.remove('accessToken');
//             Cookies.remove('refreshToken');
//             console.info('Logged out successfully.');
//         } catch (error) {
//             console.error('Logout error:', error);
//             throw error;
//         }
//     };

//     return { login, register, logout };
// };

// export default api;

// import axios from 'axios';
// import Cookies from 'js-cookie';

// // Axios Configuration
// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true, // Ensures cookies are sent with requests
// });

// let accessToken: string | null = Cookies.get('accessToken') || null;
// let isRefreshing = false; // Prevent duplicate refresh requests
// let refreshSubscribers: ((newToken: string) => void)[] = [];

// // Notify all queued subscribers with the new token
// const onRefreshed = (newToken: string) => {
//     refreshSubscribers.forEach((callback) => callback(newToken));
//     refreshSubscribers = [];
// };

// // Add Authorization header to outgoing requests
// api.interceptors.request.use((config) => {
//     if (accessToken) {
//         config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
// });

// // Handle token expiration and retry failed requests
// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         // If the error is 401 (Unauthorized), attempt to refresh the token
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             // Handle simultaneous token refreshes
//             if (isRefreshing) {
//                 return new Promise((resolve) => {
//                     refreshSubscribers.push((newToken: string) => {
//                         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//                         resolve(api(originalRequest));
//                     });
//                 });
//             }

//             isRefreshing = true;

//             try {
//                 // Refresh the token
//                 const { data } = await api.post('/refresh-token');
//                 accessToken = data.accessToken;

//                 if (accessToken) {
//                     // Store the new token in cookies
//                     Cookies.set('accessToken', accessToken, {
//                         secure: true,
//                         sameSite: 'Strict',
//                         // expires: 7,
//                     });

//                     onRefreshed(accessToken); // Notify all waiting requests
//                     isRefreshing = false;

//                     // Retry the original request with the new token
//                     originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//                     return api(originalRequest);
//                 } else {
//                     throw new Error('Failed to refresh token: No token received.');
//                 }
//             } catch (refreshError) {
//                 console.error('Token refresh failed:', refreshError);
//                 isRefreshing = false;

//                 // Clear tokens and force user to log in again
//                 accessToken = null;
//                 Cookies.remove('accessToken');
//                 throw refreshError;
//             }
//         }

//         throw error;
//     }
// );

// // Authentication Composable
// export const useAuth = () => {
//     const login = async (usernameOrEmail: string, password: string) => {
//         const { data } = await api.post('/login', { usernameOrEmail, password });
//         accessToken = data.accessToken;

//         if (accessToken) {
//             Cookies.set('accessToken', accessToken, {
//                 secure: true,
//                 sameSite: 'Strict',
//                 // expires: 7,
//             });
//         }

//         return data;
//     };

//     const register = async (username: string, email: string, password: string) => {
//         return await api.post('/register', { username, email, password });
//     };

//     const logout = async () => {
//         try {
//             // Ensure the accessToken is refreshed if necessary
//             if (!accessToken) {
//                 const { data } = await api.post('/refresh-token');
//                 accessToken = data.accessToken;

//                 if (accessToken) {
//                     Cookies.set('accessToken', accessToken, {
//                         secure: true,
//                         sameSite: 'Strict',
//                         // expires: 7,
//                     });
//                 } else {
//                     throw new Error('Failed to refresh token before logout.');
//                 }
//             }

//             // Call the logout endpoint with the valid accessToken
//             await api.post('/logout', {}, { headers: { Authorization: `Bearer ${accessToken}` } });

//             // Clear tokens and cookies after a successful logout
//             accessToken = null;
//             Cookies.remove('accessToken');
//             console.info('Logged out successfully.');
//         } catch (error) {
//             console.error('Logout error:', error);
//             throw error;
//         }
//     };

//     return { login, register, logout };
// };

// export default api;




// import axios from 'axios';
// import Cookies from 'js-cookie';
// import { useCookie } from '#app';

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true, // Ensures cookies are sent with requests
// });

// let accessToken: string | null = null;

// // Axios request interceptor
// api.interceptors.request.use((config) => {
//     if (accessToken) {
//         config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
// });

// // Axios response interceptor to handle 401 errors (e.g., token expiration)
// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             try {
//                 const { data } = await api.post('/refresh-token');
//                 accessToken = data.accessToken;

//                 if (accessToken) {
//                     Cookies.set('accessToken', accessToken, {
//                         secure: true,
//                         sameSite: 'Strict',
//                     });
//                 } else {
//                     console.error('Failed to refresh token: No token received');
//                 }

//                 originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 console.error('Error refreshing token:', refreshError);
//                 throw refreshError;
//             }
//         }

//         throw error;
//     }
// );

// export const useAuth = () => {
//     const cookieAccessToken = Cookies.get('accessToken');

//     // Update `accessToken` only if it exists
//     accessToken = cookieAccessToken || null;

//     if (!cookieAccessToken) {
//         console.info('No token found in cookies (user likely not logged in).');
//     }

//     const login = async (usernameOrEmail: string, password: string) => {
//         const { data } = await api.post('/login', { usernameOrEmail, password });
//         accessToken = data.accessToken;

//         if (accessToken) {
//             Cookies.set('accessToken', accessToken, {
//                 secure: true,
//                 sameSite: 'Strict',
//                 expires: 7, // Token expiration in days
//             });
//         } else {
//             console.error('Login failed: No access token received.');
//         }

//         return data;
//     };

//     const register = async (username: string, email: string, password: string) => {
//         return await api.post('/register', { username, email, password });
//     };

//     const logout = async () => {
//         console.info('Logging out...');
//         await api.post('/logout', {}, { headers: { Authorization: `Bearer ${accessToken}` } });
//         accessToken = null;
//         Cookies.remove('accessToken'); // Remove token from cookies
//         console.info('Logged out successfully.');
//     };

//     return { login, register, logout };
// };



// import axios from 'axios';

// const api = axios.create({
//     baseURL: 'http://localhost:8000', // Replace with your Symfony backend URL
//     withCredentials: true, // Include cookies in requests
// });

// export const useAuth = () => {
//     const login = async (usernameOrEmail: string, password: string) => {
//         try {
//             const { data } = await api.post('/login', {
//                 usernameOrEmail,
//                 password,
//             });
//             return data.message;
//         } catch (error: any) {
//             throw new Error(error.response?.data?.message || 'Login failed');
//         }
//     };

//     const register = async (username: string, email: string, password: string) => {
//         try {
//             const { data } = await api.post('/register', { username, email, password });
//             return data.message;
//         } catch (error: any) {
//             throw new Error(error.response?.data?.message || 'Registration failed');
//         }
//     };

//     const logout = async () => {
//         try {
//             await api.post('/logout');
//             return 'Logged out successfully';
//         } catch (error: any) {
//             throw new Error(error.response?.data?.message || 'Logout failed');
//         }
//     };

//     const refreshAccessToken = async () => {
//         try {
//             const { data } = await api.post('/refresh-token');
//             return data.accessToken;
//         } catch (error: any) {
//             throw new Error(error.response?.data?.message || 'Token refresh failed');
//         }
//     };

//     return {
//         login,
//         register,
//         logout,
//         refreshAccessToken,
//     };
// };


// import axios from 'axios';
// import Cookies from 'js-cookie'; // Install via npm install js-cookie
// import { useCookie } from '#app';

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true, // Ensure cookies are sent with every request
// });

// let accessToken: string | null = null;

// // Axios request interceptor to attach access token
// api.interceptors.request.use((config) => {
//     if (accessToken) {
//         config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
// });

// // Axios response interceptor to handle token expiration
// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//             try {
//                 const { data } = await api.post('/refresh-token');
//                 accessToken = data.accessToken;
//                 if (accessToken) {
//                     Cookies.set('accessToken', accessToken, {
//                         secure: true, // For HTTPS
//                         sameSite: 'Strict',
//                     });
//                 } else {
//                     console.error('No access token received');
//                 }
//                 originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 console.error('Failed to refresh token:', refreshError);
//                 // Optional: Add logic to redirect to login here
//                 throw refreshError;
//             }
//         }

//         throw error;
//     }
// );

// export const useAuth = () => {
//     const cookieAccessToken = Cookies.get('accessToken');
//     console.log('Token in Cookies:', cookieAccessToken);

//     console.log('accessToken under useAuth =', accessToken);

//     const login = async (usernameOrEmail: string, password: string) => {
//         const { data } = await api.post('/login', { usernameOrEmail, password });
//         accessToken = data.accessToken;
//         // Cookies.set('accessToken', accessToken, {
//         //     secure: true,
//         //     sameSite: 'Strict',
//         //     expires: 7, // Optional: Set token expiration in days
//         // });
//         if (accessToken) {
//             Cookies.set('accessToken', accessToken, {
//                 secure: true, // For HTTPS
//                 sameSite: 'Strict',
//                 expires: 7, // Optional: Set token expiration in days
//             });
//         } else {
//             console.error('No access token received');
//         }
//         return data;
//     };

//     const register = async (username: string, email: string, password: string) => {
//         const { data } = await api.post('/register', { username, email, password });
//         return data;
//     };

//     const logout = async () => {
//         console.log('accessToken =', accessToken);
//         await api.post('/logout', {}, { headers: { Authorization: `Bearer ${accessToken}` } });
//         accessToken = null;
//         Cookies.remove('accessToken'); // Clear token from cookies
//     };

//     return { login, register, logout };
// };

// const login = async (usernameOrEmail: string, password: string) => {
//     const { data } = await api.post('/login', { usernameOrEmail, password });

//     if (data.accessToken) {
//         const accessTokenCookie = useCookie('accessToken');
//         accessTokenCookie.value = data.accessToken;

//         console.log('Access Token Stored in Cookie:', accessTokenCookie.value);
//     } else {
//         console.error('Login API did not return an access token.');
//     }

//     return data;
// };


// import axios from 'axios';

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true, // Send cookies with every request
// });

// let accessToken: string | null = null;

// // Axios request interceptor to attach access token
// api.interceptors.request.use((config) => {
//     if (accessToken) {
//         config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
// });

// // Axios response interceptor to handle token expiration
// api.interceptors.response.use(
//     (response) => response, // Pass through if the response is successful
//     async (error) => {
//         const originalRequest = error.config;

//         // Refresh token logic if a 401 error occurs
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//             try {
//                 const { data } = await api.post('/refresh-token');
//                 accessToken = data.accessToken; // Update the in-memory token
//                 originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//                 return api(originalRequest); // Retry the failed request
//             } catch (refreshError) {
//                 console.error('Failed to refresh token:', refreshError);
//                 throw refreshError; // Logout logic can be added here
//             }
//         }

//         throw error; // Pass through other errors
//     }
// );

// export const useAuth = () => {
//     console.log('accessToken under useAuth = ', accessToken);
//     const login = async (usernameOrEmail: string, password: string) => {
//         const { data } = await api.post('/login', { usernameOrEmail, password });
//         accessToken = data.accessToken; // Store access token in memory
//         return data;
//     };

//     const register = async (username: string, email: string, password: string) => {
//         const { data } = await api.post('/register', { username, email, password });
//         return data;
//     };

//     const logout = async () => {
//         console.log('accessToken = ', accessToken);
//         await api.post('/logout', {}, { headers: { Authorization: `Bearer ${accessToken}` } });
//         accessToken = null; // Clear access token
//     };

//     return { login, register, logout };
// };


// import axios from 'axios';

// const api = axios.create({
//     baseURL: 'http://localhost:8000',
//     withCredentials: true, // Ensures httpOnly cookies are sent
// });

// export const useAuth = () => {
//     const login = async (usernameOrEmail: string, password: string) => {
//         const { data } = await api.post('/login', { usernameOrEmail, password });
//         return data;
//     };

//     const register = async (username: string, email: string, password: string) => {
//         const { data } = await api.post('/register', { username, email, password });
//         return data;
//     };

//     const logout = async () => {
//         await api.post('/logout');
//     };

//     const refreshToken = async () => {
//         const { data } = await api.post('/refresh-token');
//         return data.accessToken;
//     };

//     return { login, register, logout, refreshToken };
// };
