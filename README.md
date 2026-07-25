# Eduskunnan äänestykset

Sivu, joka näyttää eduskunnan täysistuntojen äänestykset. Kaksi välilehteä:

- **Äänestykset** — kaikki äänestykset, jokainen oma korttinsa. Klikkaamalla näet
  ryhmäjakauman ja nimilistat (ketkä äänestivät Jaa/Ei/Tyhjää/Poissa).
- **Kansanedustaja** — hae edustaja nimellä ja näet hänen oman koosteensa
  (Jaa/Ei/Tyhjää/Poissa) sekä tiiviin taulukon jokaisesta äänestyksestä ja siitä,
  miten hän äänesti.

Data haetaan eduskunnan avoimesta rajapinnasta **GitHubin omilla palvelimilla kerran
vuorokaudessa** (GitHub Actions, klo 02 UTC). Sivu pysyy ajan tasalla itsestään — omaa
konetta ei tarvita sen jälkeen kun sivu on kerran julkaistu. Tämä on GitHubissa ilmaista
julkisille repoille.

---

## Vaihtoehto A — sinulla on nämä tiedostot koneellasi

Vaatii Windowsin ja GitHub-tunnuksen. **Sinun ei tarvitse osata mitään komentoja** —
kirjaudut vain selaimessa.

1. Kaksoisklikkaa tiedostoa **`Asenna.cmd`**.
   - Jos Windows varoittaa ("Windows suojasi tietokonetta"), valitse *Lisätietoja* →
     *Suorita joka tapauksessa*.
2. Ikkunaan ilmestyy **8 merkin koodi** (esim. `AB12-CD34`) ja selain avautuu osoitteeseen
   `https://github.com/login/device`. Tämä ei ole salasana eikä 2FA-koodi.
3. Kirjoita koodi selaimeen, kirjaudu GitHub-tunnuksellasi ja paina **Authorize**.
4. Palaa ikkunaan ja odota. Skripti luo repon, lataa tiedostot, kytkee GitHub Pagesin
   päälle ja käynnistää datan haun GitHubin palvelimella.
5. Kun ikkunassa lukee **VALMIS JA TESTATTU**, sivusi on osoitteessa
   `https://<käyttäjätunnuksesi>.github.io/aanestykset/` ja avautuu selaimeen.

Ensimmäinen ajo kestää yleensä 1–3 minuuttia. Sitä **ei tarvitse** ajaa datan
päivittämiseksi — se hoituu itsestään joka yö.

---

## Vaihtoehto B — suoraan GitHubissa (ilman tiedostoja koneella)

Toimii millä tahansa käyttöjärjestelmällä, pelkällä selaimella.

1. Paina tämän repon sivulla oikeasta yläkulmasta **Fork** → **Create fork**.
2. Avaa kopiosi **Actions**-välilehti ja paina
   **I understand my workflows, go ahead and enable them**.
3. **Settings** → **Pages** → *Source*: **Deploy from a branch**, *Branch*: **main**,
   kansio **/docs** → **Save**.
4. **Actions** → työnkulku **Paivita aanestysdata** → **Run workflow** → **Run workflow**.
5. Odota vihreä ruksi (1–3 min). Sivusi:
   `https://<käyttäjätunnuksesi>.github.io/aanestykset/`.

Tämän jälkeen työnkulku ajaa itsensä joka yö klo 02 UTC.

---

## Tiedostot

| Tiedosto | Mitä tekee |
|---|---|
| `docs/index.html` | Sivu, joka näyttää datan. Välilehdet: Äänestykset ja Kansanedustaja. |
| `docs/data.json` | Haettu data. **Syntyy GitHubissa automaattisesti** — ei repossa etukäteen. |
| `hae-api.js` | Hakee äänestykset rajapinnasta ja kirjoittaa `docs/data.json`. |
| `.github/workflows/paivita.yml` | GitHub Actions: ajaa haun kerran vuorokaudessa. |
| `asenna.ps1` | Julkaisee kaiken GitHub-tunnuksellesi. |
| `Asenna.cmd` | Käynnistää `asenna.ps1`:n kaksoisklikkauksella. |

## Jos jokin menee pieleen

| Oire | Korjaus |
|---|---|
| Sivulla "Datan haku epäonnistui: HTTP 404" | Aja Actions-välilehdellä **Paivita aanestysdata** ja odota vihreä ruksi. |
| Sivun osoite antaa 404 | Settings → Pages → branch **main**, kansio **/docs** → Save. Odota minuutti. |
| Actions-välilehti on tyhjä | Actions → *I understand my workflows...*. |
| `Asenna.cmd` ei tee mitään | Avaa PowerShell ja aja `powershell -ExecutionPolicy Bypass -File asenna.ps1`. |

## Datasta

Lähde: `https://api.eduskunta.fi/api/v1/taysistunnot/istunnon-aanestykset/`. "Poissa" tarkoittaa,
ettei edustaja äänestänyt kyseisessä äänestyksessä; se ei kerro syytä.