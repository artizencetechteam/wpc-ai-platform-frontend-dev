import { redirect } from "next/navigation";

export default function Employer() {
  redirect("/auth/employer/login");
}