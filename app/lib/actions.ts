"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safe } from "./safe.utils";

const INVOICES_PATHNAME = "/dashboard/invoices";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// ---
export type TFS_createInvoice = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
// ---

const ZInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
    message: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .positive({
      message: "Please enter a positive amount (Greater than Zero).",
    })
    .transform((val) => val * 100),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
    message: "Please select an invoice status.",
  }),
  date: z.string().default(new Date().toISOString().split("T")[0]),
});

const ZInvoiceFormData = ZInvoiceSchema.omit({ id: true });

// ---

export async function createInvoice(
  prevState: TFS_createInvoice,
  formData: FormData,
) {
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve(true);
    }, 5000),
  );
  const invoiceFormData = Object.fromEntries(formData.entries());

  const {
    success: invoiceValidationSuccess,
    data: invoiceValidatedData,
    error: invoiceValidationError,
  } = ZInvoiceFormData.safeParse(invoiceFormData);

  if (!invoiceValidationSuccess)
    return {
      errors: invoiceValidationError.flatten().fieldErrors,
      message:
        "Failed to create invoice. " +
        invoiceValidationError.flatten().formErrors.join(", "),
    };

  const {
    amount: amountInCents,
    customerId,
    status,
    date,
  } = invoiceValidatedData;

  const [, sqlError] = await safe(sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `);

  if (sqlError) {
    console.log(sqlError);
    return { message: "[SQL Error]: Failed to create invoice." };
  }

  revalidatePath(INVOICES_PATHNAME);

  redirect(INVOICES_PATHNAME);
}

export type TFS_editInvoice = TFS_createInvoice;
export async function updateInvoice(
  id: string,
  prevSate: TFS_editInvoice,
  formData: FormData,
) {
  const invoiceFormData = Object.fromEntries(formData.entries());

  const {
    success: invoiceValidationSuccess,
    data: invoiceValidatedData,
    error: invoiceValidationError,
  } = ZInvoiceFormData.safeParse(invoiceFormData);
  // ---
  if (!invoiceValidationSuccess)
    return {
      errors: invoiceValidationError.flatten().fieldErrors,
      message: "Failed to update invoice.",
    };
  // ---
  const { customerId, amount: amountInCents, status } = invoiceValidatedData;

  const [, sqlError] = await safe(sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `);

  if (sqlError) {
    console.log(sqlError);
    return { message: "[SQL Error]: Failed to update invoice." };
  }

  revalidatePath(INVOICES_PATHNAME);
  redirect(INVOICES_PATHNAME);
}

export async function deleteInvoice(id: string) {
  const { id: ID } = ZInvoiceSchema.pick({ id: true }).parse({ id });

  const [, sqlError] = await safe(sql`DELETE FROM invoices WHERE id = ${ID}`);

  if (sqlError) {
    console.log(sqlError);
    return { message: "[SQL Error]: Failed to delete invoice." };
  }
  revalidatePath(INVOICES_PATHNAME);
}
