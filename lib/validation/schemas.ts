import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200)
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

/** Contact form. Shared by the browser (react-hook-form) and the server action. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[0-9+()\-.\s]*$/, "Please enter a valid phone number"),
  budget: z.string().trim().max(100),
  projectType: z.string().trim().max(100),
  message: z.string().trim().min(10, "Please share a few details (at least 10 characters)").max(5000),
  // Honeypot — must stay empty.
  website: z.string().max(200),
  // Milliseconds since the form was rendered; bots submit instantly.
  elapsed: z.number().int().nonnegative(),
});
export type ContactInput = z.infer<typeof contactSchema>;
