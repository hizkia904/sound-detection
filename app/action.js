"use server";

import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function bikinCookie() {
  const id = uuidv4();
  cookies().set("id", id);
  return id;
}
