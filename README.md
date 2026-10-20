# AnkaraDevs

https://ankaradevs.com — Ankara'nın gönüllü yazılımcı topluluğunun sitesi.

| Klasör | İçerik |
|---|---|
| `site/` | Statik site: ana sayfa ve `uyeler/` (üye listesi) |
| `members/` | Üye profilleri, kişi başına bir JSON dosyası. Ekleme kılavuzu: [CONTRIBUTING.md](CONTRIBUTING.md) |
| `scripts/` | `validate-members.mjs` (PR kontrolü), `build-members.mjs` (`site/members.json` üretir) |
| `infra/ec2-site/` | EC2 + Elastic IP + nginx + Let's Encrypt (Terraform) |

Üye sayfası `site/members.json` dosyasını GitHub'dan okur. `main`'e merge olan her üye PR'ından sonra `members` workflow'u bu dosyayı yeniden üretir; sunucuya yeniden dağıtım gerekmez.

Yerelde:

```bash
node scripts/validate-members.mjs
node scripts/build-members.mjs
```
