import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { loginAdmin } from "./actions";

const errorMessages: Record<string, string> = {
  missing: "E-posta ve şifre alanlarını doldurun.",
  invalid: "Giriş bilgileri geçersiz.",
  forbidden: "Bu hesap admin yetkisine sahip değil.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user && isAdminEmail(data.user.email)) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const message = error ? errorMessages[error] : undefined;

  return (
    <main className="adminLoginShell">
      <section className="adminPanel">
        <p className="eyebrow">TROVE YÖNETİM</p>
        <h1>Admin girişi</h1>
        <p className="heroText">
          Trove Teknoloji yönetim paneline yetkili hesabınızla giriş yapın.
        </p>

        {message ? <p className="adminError">{message}</p> : null}

        <form action={loginAdmin} className="adminForm">
          <label className="adminField">
            E-posta
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              placeholder="admin@example.com"
              required
              type="email"
            />
          </label>

          <label className="adminField">
            Şifre
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>

          <button className="adminButton" type="submit">
            Giriş yap
          </button>
        </form>
      </section>
    </main>
  );
}
