import axios from 'axios';
import { Booking, Trainer, TrainerAvailability, User, AuthResponse, OnboardingData } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
}

export const authApi = {
  login: (data: any): Promise<AuthResponse> => 
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any): Promise<AuthResponse> => 
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: (token: string): Promise<User> => 
    apiRequest<User>('/auth/me', { method: 'GET' }, token),
};

export const onboardingApi = {
  save: (data: any, token: string): Promise<{ success: boolean }> => 
    apiRequest<{ success: boolean }>('/onboarding', { method: 'POST', body: JSON.stringify(data) }, token),
  getMe: (token: string): Promise<OnboardingData & User> =>
    apiRequest<OnboardingData & User>('/onboarding/me', { method: 'GET' }, token),
  uploadProfileImage: async (file: File, onProgress: (percent: number) => void, token: string): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${BASE_URL}/onboarding/me/image`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        onProgress(percent);
      }
    });
    
    return response.data;
  },
};

export const trainerApi = {
  getAll: (token?: string, filters?: any): Promise<Trainer[]> => 
    apiRequest<Trainer[]>('/trainers', { method: 'GET' }, token),
  getRecommended: (token: string): Promise<Trainer[]> =>
    apiRequest<Trainer[]>('/trainers/recommended', { method: 'GET' }, token),
  getOne: (id: string, token?: string): Promise<Trainer> =>
    apiRequest<Trainer>(`/trainers/${id}`, { method: 'GET' }, token),
  getMe: (token: string): Promise<Trainer> =>
    apiRequest<Trainer>('/trainers/me', { method: 'GET' }, token),
  updateAvailability: (availability: Partial<TrainerAvailability>[], token: string): Promise<Trainer> =>
    apiRequest<Trainer>('/trainers/me/availability', { method: 'PUT', body: JSON.stringify(availability) }, token),
  updateProfile: (data: Partial<Trainer>, token: string): Promise<Trainer> =>
    apiRequest<Trainer>('/trainers/me', { method: 'PUT', body: JSON.stringify(data) }, token),
  uploadProfileImage: async (file: File, onProgress: (percent: number) => void, token: string): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${BASE_URL}/trainers/me/image`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        onProgress(percent);
      }
    });
    
    return response.data;
  },
  submitReview: (data: { bookingId: number; rating: number; comment?: string }, token: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>('/trainers/review', { method: 'POST', body: JSON.stringify(data) }, token),
};

export const bookingApi = {
  create: (data: { trainerId: number; date: string; timeSlot: string }, token: string): Promise<Booking & { checkoutUrl?: string }> => 
    apiRequest<Booking & { checkoutUrl?: string }>('/bookings', { method: 'POST', body: JSON.stringify(data) }, token),
  getMyBookings: (token: string): Promise<Booking[]> => 
    apiRequest<Booking[]>('/bookings/my-bookings', { method: 'GET' }, token),
  getMySessions: (token: string): Promise<Booking[]> => 
    apiRequest<Booking[]>('/bookings/my-sessions', { method: 'GET' }, token),
  getByTrainer: (trainerId: number): Promise<Booking[]> => 
    apiRequest<Booking[]>(`/bookings/trainer/${trainerId}`, { method: 'GET' }),
  updateStatus: (id: number, status: 'confirmed' | 'cancelled', cancellationReason?: string, token?: string): Promise<Booking> =>
    apiRequest<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason: cancellationReason }) }, token),
  retryPayment: (id: number, token: string): Promise<{ checkoutUrl: string }> =>
    apiRequest<{ checkoutUrl: string }>(`/bookings/${id}/retry-payment`, { method: 'POST' }, token),
};
