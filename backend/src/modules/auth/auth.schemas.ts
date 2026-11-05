import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    credential: z.string().min(1, 'Username or Email is required').max(100),
    password: z.string().min(1, 'Password is required')
  })
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
};

export const quickSwitchSchema = {
  body: z.object({
    targetRole: z.enum(['admin', 'store_person', 'sales'])
  })
};

