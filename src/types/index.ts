export type UserRole = 'user' | 'trainer';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  imageUrl?: string;
  onboardingCompleted: boolean;
  accessToken?: string;
}

export interface TrainerAvailability {
  id: number;
  trainerId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  userName: string;
  createdAt: string;
}

export interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
}

export interface Conversation {
  otherUserId: number;
  otherUserName: string;
  otherUserImage: string | null;
  lastMessage: string;
  lastMessageAt: string;
}

export interface Trainer {
  id: number;
  userId?: number;
  name: string;
  specialty: string;
  bio: string;
  imageUrl?: string;
  rating: number;
  pricePerSession: number;
  availability?: TrainerAvailability[];
  intensity?: number;
  focus?: string[];
  location?: string;
  reviews?: Review[];
  specialties?: string[];
  totalSessions?: number;
  matchScore?: number;
  matchReasons?: string[];
  matchConfidence?: number;
}

export interface Booking {
  id: number;
  userId: number;
  trainerId: number;
  date: string; // ISO Date YYYY-MM-DD
  timeSlot: string; // HH:mm
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'expired';
  expiresAt?: string;
  cancellationReason?: string;
  trainerName?: string;
  trainerSpecialty?: string;
  trainerImageUrl?: string;
  userName?: string;
  isReviewed?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface OnboardingData {
  id: number;
  userId: number;
  goal: string;
  age: number;
  height: number;
  weight: number;
  activityLevel: string;
  experienceLevel: string;
  healthConditions: string;
  workoutType: string;
  dietPreference: string;
}
