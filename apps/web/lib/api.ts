import { auth } from "./firebase/clientApp";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

interface FetchOptions extends RequestInit {
    requireAuth?: boolean;
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { requireAuth = true, headers, ...customConfig } = options;
    
    const config: RequestInit = {
        ...customConfig,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (requireAuth) {
        if (!auth.currentUser) {
            throw new Error("User not authenticated");
        }
        
        try {
            const token = await auth.currentUser.getIdToken();
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`
            };
        } catch (error) {
            console.error("Error getting auth token", error);
            throw error;
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
        return null as any as T;
    }

    return await response.json() as T;
}
