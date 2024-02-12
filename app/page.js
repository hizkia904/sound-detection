import { cookies } from "next/headers";
import Home from "./clientComp";

export const metadata = {
  title: "Sound Detection",
};

export default async function Page() {
  const cookieStore = cookies();
  const reqCookie = cookieStore.get("id");
  const id = reqCookie !== undefined ? reqCookie.value : undefined;
  return <Home id={id} />;
}
