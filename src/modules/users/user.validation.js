import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName:  z.string().min(1, 'Last name is required').trim().optional(),

  bio:        z.string().max(500, 'Bio cannot exceed 500 characters').trim().optional(),
  avatarUrl:  z.string().url('Invalid avatar URL').optional().nullable(),
  branch:     z.string().trim().optional(),           // e.g. "Computer Science"
  semester:   z.number().int().min(1).max(12).optional(),
  university: z.string().trim().optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  githubUrl:   z.string().url('Invalid GitHub URL').optional().nullable(),
  resumeUrl:   z.string().url('Invalid resume URL').optional().nullable(),

  // Skills: array of strings e.g. ["Node.js", "React", "SQL"]
  skills: z
    .array(z.string().trim().min(1))
    .max(20, 'Cannot add more than 20 skills')
    .optional(),
});