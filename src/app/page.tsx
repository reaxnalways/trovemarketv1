const categories = [
  { title: "2. El & Sıfır Telefon", text: "Telefon ilanlarını keşfet" },
  { title: "Teknik Servis", text: "Hızlı servis desteği al" },
  { title: "Laptop & Bilgisayar", text: "Bilgisayar ilanlarını incele" },
  { title: "Bilgisayar Parçaları", text: "Parça ve bileşenleri görüntüle" },
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">TROVE TEKNOLOJİ</p>
        <h1>Teknoloji alışverişi ve servis, tek yerde.</h1>
        <p className="heroText">
          Mobil öncelikli Trove MVP geliştirme ortamı hazır. İlan, servis ve ürün yönetimi modüler olarak eklenecek.
        </p>
      </section>

      <section className="categories" aria-label="Ana kategoriler">
        {categories.map((category) => (
          <article className="card" key={category.title}>
            <h2>{category.title}</h2>
            <p>{category.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
