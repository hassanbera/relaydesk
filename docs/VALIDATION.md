# Yerel doğrulama kaydı

Tarih: 1 Kasım 2026. Aşağıdaki sonuçlar bu depodaki uygulamanın yerel PostgreSQL ve tarayıcıyla doğrulanmasına aittir; barındırılmış CI çalışması değildir.

## Otomatik kontroller

- `npm run build`: ortak sözleşmeler, NestJS ve optimize Next.js derlemesi başarılı; 12 web rotası derlendi.
- `npm test`: 13 HTTP/PostgreSQL entegrasyon testi başarılı.
- `npm audit`: 0 bilinen güvenlik açığı; sonuç yalnız kontrol anındaki bağımlılık veritabanı için geçerlidir.

Testler gerçek NestJS HTTP sunucusuna ve her çalıştırmada oluşturulan ayrı PostgreSQL veritabanına gider. Mock repository kullanılmaz. Test çalıştırıcısı yalnız doğruladığı rastgele `relaydesk_test_...` veritabanını siler.

Kapsam: HttpOnly/iptal edilen oturumlar, kaynak kontrolü, çalışan kayıt izolasyonu, iç not gizliliği, Zod doğrulaması, sunucu öncelik hesabı, durum kuralları, sürüm çakışması, transaction geri dönüşü, beklemede SLA, ilk yanıt, varlık/makale erişimi, bağımsız değişiklik onayı, SLA politika değişikliği, hesap iptali, sayfalama/sorgular ve eş zamanlı yönetici değişiklikleri.

## Gerçek tarayıcı akışları

1440×1000 masaüstü ve 390×844 mobil görünümde kuyruk, genel bakış, katalog, envanter, bilgi bankası, değişiklik ve yönetim sayfaları kontrol edildi. Belge genelinde yatay taşma görülmedi; yoğun veri tabloları kendi alanında yatay kayar.

1. Yöneticiyle giriş; talep oluşturma, görevli ve ekip atama, işleme alma, herkese açık yorum ekleme.
2. Varlık ekleme; makale taslağı oluşturup yayınlama.
3. Değişiklik oluşturup onaya gönderme; kendi onay düğmesinin görünmediğini doğrulama; diğer yöneticiyle onaylama.
4. Çalışanla giriş; başkasının özel talebine erişimin 404 döndüğünü doğrulama; katalogdan kendi talebini oluşturma; atama/iç not/işlem geçmişi yetkilerinin kapalı olduğunu doğrulama.
5. Kuyrukta arama + öncelik + durum + sıralama uygulayıp talep ayrıntısına gitme ve aynı URL/filtrelere dönme; ikinci sayfayı koruma; bana atananlar ve SLA filtresinin yenilemede korunması.
6. Mobil menü ve uzun formun kendi alanında kayması.

Kontrol için oluşturulan beş kayıt, yalnız bilinen ID ve birebir kontrol edilen `UI-QA` başlık/etiketleri üzerinden transaction içinde temizlendi; başlangıç örnekleri korundu.

## Tasarım incelemesi

Kod ve güncel masaüstü/mobil/form görüntüleri üzerinden bağımsız bitiş incelemesi yapıldı. Kuyruk dönüşünde filtre kaybı bulgusu giderildi ve tekrar doğrulandı. Son karar: **ship**. Mekanik tasarım taramasındaki tek Inter yazı tipi uyarısı, veri yoğun operasyon ekranında okunabilirlik kararı olarak kabul edildi.

`docs/screenshots/*.png` bu uygulamanın yereldeki gerçek ekran görüntüleridir; kurgusal örnek kayıtlar içerir, üretilmiş ürün görseli değildir.
