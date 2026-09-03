const { z } = require("zod");

const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);
const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(72, "Password must contain at most 72 characters.");

const credentialsSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters.").max(80).optional(),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = credentialsSchema.pick({ email: true, password: true });
const githubTokenSchema = z.object({
  token: z.string().trim().min(20, "Enter a valid GitHub token.").max(500),
});

module.exports = { credentialsSchema, loginSchema,githubTokenSchema };
