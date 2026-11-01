import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone-message">
      <h1>Sayfa bulunamadı</h1>
      <p>Bağlantıyı kontrol edin veya taleplere dönün.</p>
      <Link href="/tickets">Taleplere dön</Link>
    </main>
  );
}
