import * as Yup from "yup";

// Same Yup + Formik pairing as the registration portal, now for a bigger form.
export const productSchema = Yup.object({
  title: Yup.string().trim().min(3, "Use at least 3 characters").max(80, "Keep it under 80 characters").required("Give the product a name"),
  brand: Yup.string().trim().max(40, "Keep it under 40 characters").default(""),
  category: Yup.string().required("Pick a category"),
  price: Yup.number()
    .typeError("Enter a price, like 24.99")
    .min(0.01, "Price must be above zero")
    .max(100000, "That's a very expensive product")
    .required("Enter a price"),
  stock: Yup.number()
    .typeError("Enter a whole number")
    .integer("Use a whole number")
    .min(0, "Stock can't be negative")
    .max(100000, "Too many units")
    .required("Enter the units in stock"),
  discountPercentage: Yup.number().typeError("Enter a number").min(0, "Can't be below 0%").max(90, "Max discount is 90%").default(0),
  description: Yup.string()
    .trim()
    .min(10, "Describe it in at least 10 characters")
    .max(500, "Keep it under 500 characters")
    .required("Add a short description"),
});

export const emptyProduct = { title: "", brand: "", category: "", price: "", stock: "", discountPercentage: 0, description: "" };

export const loginSchema = Yup.object({
  email: Yup.string().trim().email("That doesn't look like an email address").required("Enter your email"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Enter your password"),
});

export const userSchema = Yup.object({
  name: Yup.string().trim().min(2, "Name is too short").max(60).required("Enter a name"),
  email: Yup.string().trim().email("That doesn't look like an email address").required("Enter an email"),
  password: Yup.string().min(8, "Use at least 8 characters").required("Set a starting password"),
  role: Yup.string().oneOf(["admin", "viewer"]).required(),
  title: Yup.string().trim().max(60).default(""),
});
