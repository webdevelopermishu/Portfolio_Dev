// Generates the placeholder artwork in public/seed. Run: node scripts/generate-seed-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const out = "public/seed";
mkdirSync(out, { recursive: true });
const save = (name, svg) => writeFileSync(`${out}/${name}`, svg.trim() + "\n");

// Portrait placeholder: a neutral, faceless bust on a transparent background.
save("portrait.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 140 800 860" width="800" height="860" role="img" aria-label="Portrait placeholder">
  <defs>
    <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23262f"/><stop offset="1" stop-color="#0f1117"/></linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8dbe6"/><stop offset="1" stop-color="#bfc3d1"/></linearGradient>
  </defs>
  <path d="M112 1000c0-190 44-330 150-384 52-26 96-40 138-40s86 14 138 40c106 54 150 194 150 384z" fill="url(#shirt)"/>
  <path d="M334 560h132v70l-66 78-66-78z" fill="#b3b7c6"/>
  <path d="M320 596l80 112-58 60-70-128zM480 596l-80 112 58 60 70-128z" fill="#2c303b"/>
  <path d="M400 708v292" stroke="#3a3f4c" stroke-width="3"/>
  <g fill="#454a58"><circle cx="400" cy="770" r="6"/><circle cx="400" cy="850" r="6"/><circle cx="400" cy="930" r="6"/></g>
  <rect x="470" y="800" width="92" height="74" rx="6" fill="none" stroke="#343844" stroke-width="3"/>
  <ellipse cx="400" cy="372" rx="132" ry="164" fill="url(#skin)"/>
  <path d="M262 356c-10-120 54-196 142-196s150 70 136 190c-12-62-44-98-80-110-60 24-150 26-178 22-10 22-18 56-20 94z" fill="#1c1f27"/>
</svg>`);

save("favicon.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0f1524"/>
<path d="M22 20l-12 12 12 12M42 20l12 12-12 12M36 16l-8 32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

// Project artwork: abstract application screens.
const palettes = [
  ["#ece7dc", "#16181d", "#e4572e", "#f3efe6"],
  ["#bfe3d0", "#0e3b2e", "#c6f432", "#eaf6ef"],
  ["#dbe6f6", "#1d3fa8", "#ff7a59", "#f4f8ff"],
  ["#c9d6e3", "#0b2545", "#3fa7d6", "#eef3f8"],
  ["#e7defa", "#3b1f6b", "#f7b32b", "#f6f1ff"],
  ["#f6dfd3", "#5a1e12", "#1f8a70", "#fff5ef"],
];
const screen = (x, y, w, h, [, dark, accent, light], variant) => {
  const rows = [];
  rows.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${light}"/>`);
  rows.push(`<rect x="${x}" y="${y}" width="${w}" height="${h * 0.34}" rx="14" fill="${variant ? dark : accent}"/>`);
  rows.push(`<rect x="${x + 18}" y="${y + 16}" width="${w * 0.22}" height="8" rx="4" fill="${light}" opacity=".9"/>`);
  rows.push(`<rect x="${x + 18}" y="${y + h * 0.13}" width="${w * 0.62}" height="16" rx="5" fill="${light}"/>`);
  rows.push(`<rect x="${x + 18}" y="${y + h * 0.2}" width="${w * 0.44}" height="16" rx="5" fill="${light}" opacity=".85"/>`);
  rows.push(`<rect x="${x + 18}" y="${y + h * 0.27}" width="70" height="20" rx="10" fill="${variant ? accent : dark}"/>`);
  const cw = (w - 36 - 24) / 3;
  for (let i = 0; i < 3; i++) {
    rows.push(`<rect x="${x + 18 + i * (cw + 12)}" y="${y + h * 0.4}" width="${cw}" height="${h * 0.2}" rx="8" fill="${i === 1 ? accent : dark}" opacity="${i === 1 ? 0.9 : 0.12}"/>`);
  }
  for (let i = 0; i < 4; i++) {
    rows.push(`<rect x="${x + 18}" y="${y + h * 0.66 + i * 22}" width="${w * (0.8 - i * 0.12)}" height="9" rx="4.5" fill="${dark}" opacity=".22"/>`);
  }
  rows.push(`<rect x="${x + w * 0.56}" y="${y + h * 0.82}" width="${w * 0.36}" height="${h * 0.12}" rx="8" fill="${dark}" opacity=".85"/>`);
  return rows.join("");
};
palettes.forEach((p, i) => {
  save(`project-${i + 1}.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="Project artwork placeholder">
  <rect width="800" height="800" fill="${p[0]}"/>
  <g transform="rotate(${i % 2 ? 4 : -4} 400 400)">
    ${screen(70, 90, 330, 600, p, false)}
    ${screen(430, 150, 310, 560, p, true)}
  </g>
</svg>`);
});

// Fictional client wordmarks.
const marks = [
  ["Lumora", `<circle cx="22" cy="40" r="12" fill="none" stroke="#6b7280" stroke-width="4"/>`],
  ["Kestrel Labs", `<path d="M10 52l12-24 12 24z" fill="#6b7280"/>`],
  ["Brightline", `<rect x="10" y="30" width="24" height="6" rx="3" fill="#6b7280"/><rect x="10" y="42" width="16" height="6" rx="3" fill="#6b7280"/>`],
  ["Novaterra", `<path d="M22 26l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#6b7280"/>`],
  ["Quillstack", `<rect x="10" y="28" width="24" height="24" rx="6" fill="none" stroke="#6b7280" stroke-width="4"/>`],
  ["Harborly", `<path d="M10 46c8-14 16-14 24 0" fill="none" stroke="#6b7280" stroke-width="4" stroke-linecap="round"/>`],
  ["Opaline", `<circle cx="16" cy="40" r="8" fill="#6b7280"/><circle cx="28" cy="40" r="8" fill="#6b7280" opacity=".5"/>`],
  ["Vertexa", `<path d="M10 28l12 24 12-24" fill="none" stroke="#6b7280" stroke-width="4" stroke-linejoin="round"/>`],
];
marks.forEach(([name, glyph], i) => {
  save(`client-${i + 1}.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 14 210 52" width="210" height="52" role="img" aria-label="${name} (sample logo)">
  ${glyph}
  <text x="46" y="48" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="${i % 2 ? 700 : 500}" fill="#6b7280" letter-spacing="${i % 3 ? 0 : 1}">${name}</text>
</svg>`);
});

// Avatar placeholders.
["#e4572e", "#1d3fa8", "#0e3b2e", "#3b1f6b", "#5a1e12", "#0b2545"].forEach((c, i) => {
  save(`avatar-${i + 1}.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Avatar placeholder">
  <rect width="96" height="96" rx="48" fill="${c}"/>
  <circle cx="48" cy="38" r="16" fill="#fff" opacity=".92"/><path d="M18 88c2-22 14-32 30-32s28 10 30 32z" fill="#fff" opacity=".92"/>
</svg>`);
});
console.log("Seed assets written to", out);
