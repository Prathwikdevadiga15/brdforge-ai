import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  domain: z.string().trim().min(2).max(100).default("General"),
  owner: z.string().trim().min(1).max(100).default("Workspace owner"),
});

export const ingestTextSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  content: z.string().trim().min(20).max(100_000),
  type: z.enum(["meeting", "email", "policy", "document", "transcript"]).default("document"),
});

export const resolveConflictSchema = z.object({
  resolution: z.string().trim().min(3).max(2000),
});

export const updateRequirementSchema = z.object({
  status: z.enum(["draft", "validated", "review", "approved"]),
});

export function validationMessage(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ");
}
