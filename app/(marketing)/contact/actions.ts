"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  subject: z.string().optional(),
  message: z.string().min(10, "Please write a little more (10+ characters)."),
});

export type ContactState = {
  ok: boolean;
  error?: string;
};

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert(parsed.data);

  if (error) {
    return { ok: false, error: "Something went wrong, please try again." };
  }
  return { ok: true };
}
