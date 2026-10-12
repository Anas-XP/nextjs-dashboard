"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safe } from "./safe.utils";

const INVOICES_PATHNAME = "/dashboard/invoices";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const ZInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce
    .number()
    .positive("Please, enter a positive amount.")
    .transform((val) => val * 100),
  status: z.enum(["pending", "paid"]),
  date: z.string().default(new Date().toISOString().split("T")[0]),
});

const ZInvoiceFormData = ZInvoiceSchema.omit({ id: true });

export async function createInvoice(formData: FormData) {
  const invoiceFormData = Object.fromEntries(formData.entries());

  const {
    amount: amountInCents,
    customerId,
    status,
    date,
  } = ZInvoiceFormData.parse(invoiceFormData);

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

export async function updateInvoice(id: string, formData: FormData) {
  const invoiceFormData = Object.fromEntries(formData.entries());

  const {
    customerId,
    amount: amountInCents,
    status,
  } = ZInvoiceFormData.parse(invoiceFormData);

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
