// Hakee taysistuntojen aanestykset eduskunnan rajapinnasta ja kirjoittaa docs/data.json
const fs = require("node:fs");
const path = require("node:path");

const JUURI = "https://api.eduskunta.fi/api/v1/taysistunnot/istunnon-aanestykset/";
const VUODET = (process.env.VUODET || "2026").split(",").map(s => s.trim()).filter(Boolean);
const ISTUNTOJA = 220;

// Rajapinta antaa vain eduskuntaryhman, ei puoluetta -> ryhma kartoitetaan puolueeksi.
const PUOLUE = {
  "Kansallisen kokoomuksen eduskuntaryhmä": "Kansallinen Kokoomus",
  "Perussuomalaisten eduskuntaryhmä": "Perussuomalaiset",
  "Sosialidemokraattinen eduskuntaryhmä": "Suomen Sosialidemokraattinen Puolue",
  "Keskustan eduskuntaryhmä": "Suomen Keskusta",
  "Vihreä eduskuntaryhmä": "Vihreä liitto",
  "Vasemmistoliiton eduskuntaryhmä": "Vasemmistoliitto",
  "Ruotsalainen eduskuntaryhmä": "Suomen ruotsalainen kansanpuolue",
  "Kristillisdemokraattinen eduskuntaryhmä": "Suomen Kristillisdemokraatit",
  "Liike Nyt -eduskuntaryhmä": "Liike Nyt"
};
function puolue(ryhmanNimi) {
  const g = String(ryhmanNimi || "").trim();
  return PUOLUE[g] || g;
}

const KOODI = { "Jaa": "J", "Ei": "E", "Poissa": "P" };
function koodi(teksti) {
  const t = String(teksti || "").trim();
  if (KOODI[t]) return KOODI[t];
  if (t.indexOf("Tyhj") === 0) return "T";
  return "?";
}

async function hae(url) {
  let virhe = null;
  for (let y = 0; y < 3; y++) {
    try {
      const v = await fetch(url, { headers: { "Accept": "application/json" } });
      if (v.status === 404) return null;
      if (!v.ok) throw new Error("HTTP " + v.status);
      return await v.json();
    } catch (e) {
      virhe = e;
      await new Promise(r => setTimeout(r, 1500 * (y + 1)));
    }
  }
  throw virhe;
}

function jakaumat(r) {
  const lista = r.eduskuntaryhmaJakaumat || [];
  return lista.map(x => ({
    ryhma: String((x.nimi && (x.nimi.fi || x.nimi)) || "").trim(),
    jaa: +(x.jaa || 0), ei: +(x.ei || 0), tyhjaa: +(x.tyhjia || x.tyhjaa || 0), poissa: +(x.poissa || 0)
  })).filter(x => x.ryhma);
}

(async () => {
  const edustajat = [];
  const avain = new Map();
  const aanestykset = [];

  for (const vuosi of VUODET) {
    for (let n = 1; n <= ISTUNTOJA; n++) {
      const data = await hae(JUURI + vuosi + "-" + n);
      if (!data) continue;
      const rivit = Array.isArray(data) ? data : (data.rowData || data.items || []);
      if (!rivit.length) continue;

      for (const r of rivit) {
        const tapahtumat = r.aanestystapahtumat || [];
        const aanet = [];
        for (const t of tapahtumat) {
          const suku = String(t.sukunimi || "").trim();
          const etu = String(t.etunimi || "").trim();
          const ryhma = String((t.edkryhmalyhenne && t.edkryhmalyhenne.fi) || "").trim();
          const pue = puolue(t.eduskuntaryhma && t.eduskuntaryhma.fi);
          const k = suku + "|" + etu;
          let idx = avain.get(k);
          if (idx === undefined) {
            idx = edustajat.length;
            avain.set(k, idx);
            edustajat.push({ sukunimi: suku, etunimi: etu, ryhma: ryhma, puolue: pue });
          } else {
            if (ryhma) edustajat[idx].ryhma = ryhma;
            if (pue) edustajat[idx].puolue = pue;
          }
          aanet.push([idx, koodi((t.kayttaytyminen && t.kayttaytyminen.fi) || t.kayttaytyminen)]);
        }
        const tulos = r.aanestystulos || {};
        aanestykset.push({
          id: String(r.id || (vuosi + "-" + n + "-" + (r.aanestysnumero || aanestykset.length))),
          pvm: String(r.istuntopvm || "").slice(0, 10),
          istunto: String(r.istuntonumero || n) + "/" + vuosi,
          kohta: String((r.kohta && r.kohta.otsikko && r.kohta.otsikko.fi) || "").trim(),
          otsikko: String((r.aanestysotsikko && r.aanestysotsikko.fi) || r.aanestysotsikko || "").trim(),
          jaa: +(tulos.jaa || 0), ei: +(tulos.ei || 0),
          tyhjaa: +(tulos.tyhjia || tulos.tyhjaa || 0), poissa: +(tulos.poissa || 0),
          ryhmat: jakaumat(r),
          aanet: aanet
        });
      }
      console.log(vuosi + "-" + n + ": " + rivit.length + " aanestysta");
    }
  }

  aanestykset.sort((a, b) => (a.pvm < b.pvm ? 1 : a.pvm > b.pvm ? -1 : 0));

  const ulos = {
    paivitetty: new Date().toISOString(),
    lahde: JUURI,
    edustajat: edustajat,
    aanestykset: aanestykset
  };
  const tiedosto = path.join(__dirname, "docs", "data.json");
  fs.writeFileSync(tiedosto, JSON.stringify(ulos), "utf8");
  console.log("Kirjoitettu " + tiedosto + ": " + aanestykset.length + " aanestysta, " + edustajat.length + " edustajaa");
  if (!aanestykset.length) { console.error("VIRHE: ei yhtaan aanestysta"); process.exit(1); }
})().catch(e => { console.error("VIRHE: " + e.message); process.exit(1); });