// Exports web images from media/ and writes the portfolio galleries.
//   cd tools && npm install && node build.js [--force]
// Images: <slug>.jpg (1600 px long edge, 2400 for heroes), <slug>-sm.jpg (600 px short edge),
// <slug>-md.jpg (1600 px, heroes only). Existing files are skipped unless --force is given.
// Galleries: replaces everything between <!-- gallery:<id> --> and <!-- /gallery:<id> --> in portfolio.html.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { heroes, logo, shoots } = require("./photos");

const root = path.resolve(__dirname, "..");
const media = path.join(root, "media", "JudePics");
const force = process.argv.includes("--force");
const exif = { IFD0: { Artist: "Judite Howell", Copyright: "© Judite Howell, SDP Real Estate" } };
const jpg = img => img.withExif(exif).jpeg({ quality: 78, mozjpeg: true, progressive: true });
const esc = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

async function exportPhoto(shoot, [num, slug]) {
  const src = path.join(media, `${shoot.prefix}-${num}.jpg`);
  const dir = path.join(root, "images", shoot.folder);
  const big = path.join(dir, `${slug}.jpg`), small = path.join(dir, `${slug}-sm.jpg`);
  const hero = heroes.includes(`${shoot.prefix}-${num}`);
  fs.mkdirSync(dir, { recursive: true });
  if (force || !fs.existsSync(big) || !fs.existsSync(small) || (hero && !fs.existsSync(big.replace(/\.jpg$/, "-md.jpg")))) {
    const { width, height } = await sharp(src).metadata();
    const landscape = width >= height;
    const fit = long => (landscape ? { width: long } : { height: long });
    await jpg(sharp(src).resize(fit(hero ? 2400 : 1600))).toFile(big);
    await jpg(sharp(src).resize(landscape ? { height: 600 } : { width: 600 })).toFile(small);
    if (hero) await jpg(sharp(src).resize(fit(1600))).toFile(big.replace(/\.jpg$/, "-md.jpg"));
    console.log("exported", `${shoot.folder}/${slug}`);
  }
  // Gallery uses the 1600 px file (the -md version for heroes) and the small one.
  const large = hero ? big.replace(/\.jpg$/, "-md.jpg") : big;
  const [L, S] = await Promise.all([sharp(large).metadata(), sharp(small).metadata()]);
  return { L, S, large: path.relative(root, large).replace(/\\/g, "/"), small: path.relative(root, small).replace(/\\/g, "/") };
}

(async () => {
  // Logo: trim the transparent margin and size for retina.
  const logoOut = path.join(root, logo.out);
  fs.mkdirSync(path.dirname(logoOut), { recursive: true });
  if (force || !fs.existsSync(logoOut)) {
    await sharp(path.join(root, logo.src)).trim().resize({ width: logo.width }).png({ compressionLevel: 9, palette: true }).toFile(logoOut);
    console.log("exported logo");
  }

  const pagePath = path.join(root, "portfolio.html");
  let page = fs.readFileSync(pagePath, "utf8");
  const manifest = [];

  for (const shoot of shoots) {
    const figures = [];
    for (const photo of shoot.photos) {
      const { L, S, large, small } = await exportPhoto(shoot, photo);
      manifest.push(`${large}\t${shoot.prefix}-${photo[0]}.jpg`);
      // The link opens the large photo directly without JavaScript; js/main.js turns it into the photo viewer.
      figures.push(
        `        <figure><a href="${large}"><img loading="lazy" decoding="async" width="${L.width}" height="${L.height}" src="${small}" ` +
        `srcset="${small} ${S.width}w, ${large} ${L.width}w" sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 430px" alt="${esc(photo[2])}"></a></figure>`
      );
    }
    const open = `<!-- gallery:${shoot.id} -->`, close = `<!-- /gallery:${shoot.id} -->`;
    const a = page.indexOf(open), b = page.indexOf(close);
    if (a < 0 || b < 0) throw new Error(`Missing gallery markers for ${shoot.id} in portfolio.html`);
    page = page.slice(0, a + open.length) + "\n" + figures.join("\n") + "\n      " + page.slice(b);
    console.log(`gallery ${shoot.id}: ${figures.length} photos`);
  }

  fs.writeFileSync(pagePath, page);
  fs.writeFileSync(path.join(root, ".claude", "image-manifest.txt"), manifest.join("\n") + "\n");
})();
