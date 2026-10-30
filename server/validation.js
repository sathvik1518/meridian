import { z } from "zod";

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").max(120),
  password: z.string().min(1, "Password is required").max(200),
  remember: z.boolean().default(true),
});

export const productInput = z.object({
  title: z.string().trim().min(3, "Name must be at least 3 characters").max(80),
  brand: z.string().trim().max(40).default(""),
  category: z.string().trim().min(1, "Choose a category"),
  description: z.string().trim().max(500).default(""),
  price: z.coerce.number().positive("Price must be greater than 0").max(100_000),
  discountPercentage: z.coerce.number().min(0).max(90).default(0),
  stock: z.coerce.number().int("Stock must be a whole number").min(0).max(100_000),
});

export const productPatch = productInput.partial().refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const SORT_SQL = {
  relevance: "p.created_at DESC, p.id DESC",
  "price-asc": "(p.price * (1 - p.discount_percentage / 100)) ASC, p.id",
  "price-desc": "(p.price * (1 - p.discount_percentage / 100)) DESC, p.id",
  "rating-desc": "p.rating DESC, p.id",
  "stock-asc": "p.stock ASC, p.id",
  "stock-desc": "p.stock DESC, p.id",
  "title-asc": "LOWER(p.title) ASC, p.id",
};

export const productQuery = z.object({
  q: z.string().trim().max(80).default(""),
  category: z.string().trim().max(60).default(""),
  stock: z.enum(["all", "low", "out", "attention"]).default("all"),
  sort: z.enum(Object.keys(SORT_SQL)).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const orderQuery = z.object({
  q: z.string().trim().max(80).default(""),
  status: z.enum(["all", "pending", "processing", "shipped", "delivered", "cancelled"]).default("all"),
  sort: z.enum(["newest", "oldest", "total-desc", "total-asc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const orderStatusInput = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

export const restockInput = z.object({
  items: z
    .array(z.object({ productId: z.coerce.number().int().positive(), qty: z.coerce.number().int().min(1).max(10_000) }))
    .min(1, "Add at least one product")
    .max(200),
});

export const newUserInput = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "Use at least 8 characters").max(100),
  role: z.enum(["admin", "viewer"]),
  title: z.string().trim().max(60).default(""),
});

export const userPatch = z
  .object({ role: z.enum(["admin", "viewer"]).optional(), active: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const newOrderInput = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Customer name is too short").max(60),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid customer email")),
    city: z.string().trim().max(60).default(""),
  }),
  items: z
    .array(z.object({ productId: z.coerce.number().int().positive(), quantity: z.coerce.number().int().min(1).max(1000) }))
    .min(1, "Add at least one product")
    .max(50),
});
