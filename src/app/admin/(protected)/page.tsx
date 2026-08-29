import Link from "next/link";
import { logoutAdmin } from "./actions";

type AdminHomePageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created } = await searchParams;

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <p className="eyebrow">TROVE YÖNETİM</p>
        <form action={logoutAdmin}>
          <button className="adminButton adminButtonSecondary" type="submit">Çıkış</button>
        </form>
      </header>

      {created ? <p className="adminSuccess">Taslak ilan oluşturuldu: <strong>{created}</strong></p> : null}

      <section className="adminDashboardCard">
        <h1>Yönetim paneli</h1>
        <p>İlanları küçük ve kontrollü adımlarla yöneteceğiz. İlk akış taslak ürün oluşturmaktır.</p>
        <div className="adminDashboardActions">
          <Link className="adminButton adminActionLink" href="/admin/listings/new">Yeni ilan oluştur</Link>
        </div>
      </section>
    </main>
  );
}
