import { logoutAdmin } from "./actions";

export default function AdminHomePage() {
  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <p className="eyebrow">TROVE YÖNETİM</p>
        <form action={logoutAdmin}>
          <button className="adminButton adminButtonSecondary" type="submit">
            Çıkış
          </button>
        </form>
      </header>

      <section className="adminDashboardCard">
        <h1>Yönetim paneli hazır.</h1>
        <p>
          Bu alan yalnızca yetkili admin hesabına açıktır. Sonraki adımda ilan oluşturma
          akışını bu korumalı alanın içine ekleyeceğiz.
        </p>
      </section>
    </main>
  );
}
