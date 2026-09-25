import { LoginForm } from "@/components/forms/auth-forms";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import "../admin.css";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <div className="bo-login">
      <div className="gate-box">
        <p className="kicker">Back-office</p>
        <h1>Kya Design</h1>
        <LoginForm />
      </div>
    </div>
  );
}
