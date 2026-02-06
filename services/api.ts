import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  requiresVerification?: boolean;
  attemptsRemaining?: number;
  retryAfter?: number;
}

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

const request = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error: any) {
    // Network error
    return {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
    };
  }
};

// Auth API calls
export const authAPI = {
  register: (body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyOtp: (body: { email: string; otp: string }) =>
    request<{ token: string; user: any }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resendOtp: (body: { email: string }) =>
    request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  updateProfile: (body: { fullName?: string; phone?: string }) =>
    request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  uploadProfilePicture: (base64Image: string) =>
    request<{ user: any; imageUrl: string }>('/auth/profile-picture', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    }),

  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

// Categories API calls
export const categoriesAPI = {
  getAll: () => request<any[]>('/categories'),
};

// Services API calls
export const servicesAPI = {
  getAll: (category?: string) => {
    const query = category && category !== 'All' ? `?category=${category}` : '';
    return request<any[]>(`/services${query}`);
  },
  getById: (id: string) => request<any>(`/services/${id}`),
};

// Orders API calls
export const ordersAPI = {
  create: (body: { serviceId: string; paymentPhone: string }) =>
    request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createManual: (body: {
    serviceId: string;
    paymentPhone: string;
    manualPaymentProof: string;
  }) =>
    request<any>('/orders/manual', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMyOrders: () => request<any[]>('/orders'),
  getById: (id: string) => request<any>(`/orders/${id}`),
  checkPaymentStatus: (orderId: string) =>
    request<{ paymentStatus: string; orderStatus: string }>(
      `/orders/${orderId}/payment-status`
    ),
  paymentTimeout: (orderId: string) =>
    request(`/orders/${orderId}/payment-timeout`, { method: 'POST' }),
};

// Settings API calls
export const settingsAPI = {
  getPaymentSettings: () =>
    request<{
      manualPaymentEnabled: boolean;
      manualPaymentPhone: string;
      manualPaymentName: string;
      manualPaymentInstructions: string;
      ussdPaymentEnabled: boolean;
    }>('/settings/payment'),
};

// Notifications API calls
export const notificationsAPI = {
  getAll: (page: number = 1) =>
    request<{
      notifications: any[];
      unreadCount: number;
      total: number;
      page: number;
      pages: number;
    }>(`/notifications?page=${page}&limit=30`),
  getUnreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),
};

export default request;
