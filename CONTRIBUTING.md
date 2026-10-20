# Üye listesine kendini ekle

AnkaraDevs üye listesi (https://ankaradevs.com/uyeler/) bu repodaki `members/` klasöründen üretilir. Herkes kendini bir pull request ile ekler. Kimse başkasını ekleyemez.

## En kolay yol

https://ankaradevs.com/uyeler/#katil adresine GitHub kullanıcı adını yaz ve **GitHub'da dosyamı oluştur** düğmesine bas. Şablon hazır olarak açılır, bilgilerini doldurup **Propose changes** → **Create pull request** dersin.

## Elle

1. Repo'yu fork'la.
2. `members/<github-kullanici-adin>.json` dosyasını oluştur (küçük harf):

```json
{
  "name": "Adın Soyadın",
  "github": "kullanici-adin",
  "title": "Backend Developer",
  "company": "Şirket",
  "bio": "Kısa bir tanıtım.",
  "skills": ["Go", "PostgreSQL", "Kubernetes"],
  "linkedin": "https://www.linkedin.com/in/kullanici-adin",
  "website": "https://ornek.dev",
  "available_for": ["mentorluk"]
}
```

3. PR aç.

| Alan | Zorunlu | Kural |
|---|---|---|
| `name` | Evet | En fazla 60 karakter |
| `github` | Evet | GitHub kullanıcı adın, dosya adıyla aynı |
| `title` | Evet | Ne iş yaptığın, en fazla 60 karakter |
| `skills` | Evet | 1–8 beceri, her biri en fazla 24 karakter |
| `company` | Hayır | En fazla 60 karakter |
| `bio` | Hayır | En fazla 200 karakter |
| `linkedin` | Hayır | `https://www.linkedin.com/in/...` |
| `website` | Hayır | `https://` ile başlamalı |
| `available_for` | Hayır | `mentorluk`, `konusmacilik`, `is-firsati` |

İsteğe bağlı alanları paylaşmak istemiyorsan dosyadan sil. Başka alan kabul edilmez.

## Kontroller

PR açınca otomatik kontrol çalışır:

- Dosya geçerli JSON ve yukarıdaki kurallara uyuyor mu.
- Dosya adı ve `github` alanı PR'ı açan hesapla aynı mı. PR sadece `members/<senin-adin>.json` dosyasına dokunabilir.

Kontrol kırmızıysa PR'daki "Details" bağlantısında neyin düzeltileceği yazar. Kontrol geçince bir yönetici PR'ı onaylar ve profilin birkaç dakika içinde sitede görünür.

## Güncelleme ve silme

Bilgilerini değiştirmek için dosyanı düzenleyen, listeden çıkmak için dosyanı silen bir PR aç. Aynı kontroller geçerli.
