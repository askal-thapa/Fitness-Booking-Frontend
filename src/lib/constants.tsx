import React from 'react';
import { Flame, Dumbbell, HeartPulse, StretchHorizontal, ClipboardList, Salad } from 'lucide-react';

export const SPECIALTIES = [
  { value: 'Weight Loss', label: 'Weight Loss', icon: <Flame className="w-3.5 h-3.5" /> },
  { value: 'Muscle Building', label: 'Muscle Building', icon: <Dumbbell className="w-3.5 h-3.5" /> },
  { value: 'Endurance', label: 'Endurance', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  { value: 'Flexibility', label: 'Flexibility', icon: <StretchHorizontal className="w-3.5 h-3.5" /> },
  { value: 'Consultant', label: 'Consultant', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { value: 'Diet Planner', label: 'Diet Planner', icon: <Salad className="w-3.5 h-3.5" /> },
] as const;

export const TRAINING_FOCUS = [
  { value: 'Weight Loss', label: 'Weight Loss', icon: <Flame className="w-3.5 h-3.5" /> },
  { value: 'Muscle Building', label: 'Muscle Building', icon: <Dumbbell className="w-3.5 h-3.5" /> },
  { value: 'Endurance', label: 'Endurance', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  { value: 'Flexibility', label: 'Flexibility', icon: <StretchHorizontal className="w-3.5 h-3.5" /> },
  { value: 'Consultant', label: 'Consultant', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { value: 'Diet Planner', label: 'Diet Planner', icon: <Salad className="w-3.5 h-3.5" /> },
] as const;

export type SpecialtyValue = typeof SPECIALTIES[number]['value'];
export type TrainingFocusValue = typeof TRAINING_FOCUS[number]['value'];
