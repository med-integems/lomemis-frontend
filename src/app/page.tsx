import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login page - authentication will handle dashboard redirect
  redirect("/login");
}
