"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(["pending", "paid"]),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const rawFormData = {
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    };
    const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
        console.error(error);
        return {
            message: "Database Error: Failed to Create Invoice",
        };
    }

    // Next.js 有一个客户端路由缓存，它会将路由片段暂时存储在用户的浏览器中。配合预取功能，该缓存可以确保用户能够快速地在路由之间切换，同时减少向服务器发出的请求次数。
    // 由于您正在更新发票路由中显示的数据，因此需要清除此缓存并触发新的服务器请求。您可以使用 Next.js 中的 `revalidatePath` 函数来实现这一点
    revalidatePath("/dashboard/invoices");

    redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
    try {
        const rawFormData = {
            customerId: formData.get("customerId"),
            amount: formData.get("amount"),
            status: formData.get("status"),
        };
        const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
        const amountInCents = amount * 100;

        try {
            await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
          `;
        } catch (error) {
            console.error(error);
            return {
                message: "Database Error: Failed to Update Invoice",
            };
        }

        revalidatePath("/dashboard/invoices");

        redirect("/dashboard/invoices");
    } catch (e) {}
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices  WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        return {
            message: "Database Error: Failed to Delete Invoice",
        };
    }

    revalidatePath("/dashboard/invoices");
}
