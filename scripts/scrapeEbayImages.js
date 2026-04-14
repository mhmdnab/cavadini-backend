/**
 * Kampfer-Outlet — eBay Image Scraper
 *
 * Fetches product images from eBay listings using item numbers.
 * Downloads all images into: public/images/products/<itemNumber>/
 *
 * Run with: node scripts/scrapeEbayImages.js
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ── All 50 products with eBay item numbers ────────────────────────────────────
const PRODUCTS = [
  { name: "Cavadini Streetfighter CV-1606", itemNumber: "305768610577" },
  { name: "Cavadini Blackhawk Titan CV-1604T", itemNumber: "306648202831" },
  { name: "Cavadini Globetrotter Blue CV-1000", itemNumber: "365650908176" },
  {
    name: "Cavadini Leonardo Indo-Arabic CV-330JN",
    itemNumber: "366020262004",
  },
  { name: "Cavadini Yukon Nostalgia CV-12K150", itemNumber: "305567500615" },
  { name: "Cavadini Diella Rose Gold 45mm", itemNumber: "306280516186" },
  { name: "Cavadini Yukon 2 CV-4305", itemNumber: "364416551405" },
  { name: "Cavadini Yukon Simply CV-4302", itemNumber: "304435058829" },
  { name: "Cavadini Caruso CV-745", itemNumber: "362035476927" },
  { name: "Zentra Z-28372-2", itemNumber: "363577341747" },
  { name: "Elysee Strass 23019", itemNumber: "303965330595" },
  { name: "Esprit ES103581004", itemNumber: "363592526480" },
  { name: "Festina Bangle 8948", itemNumber: "304265713173" },
  { name: "Fila Chronograph FA0783-43", itemNumber: "364721972278" },
  { name: "Gadison Stern T-Force GS-230", itemNumber: "365332470831" },
  { name: "Gooix Pilot XXL", itemNumber: "304785359089" },
  { name: "Jacques Cantani Venezia JC-890", itemNumber: "303893186938" },
  { name: "Jacques Cantani Dark Horse JC-1050", itemNumber: "361980412328" },
  { name: "Jacques Cantani Milano JC-881", itemNumber: "363636076623" },
  { name: "Jacques Lemans Ladies JL-813", itemNumber: "363870707472" },
  { name: "Jacques Lemans Quarz-Matic JL-791", itemNumber: "306694877000" },
  { name: "Jaguar Friendship J-288/2", itemNumber: "362642927297" },
  { name: "Lacher Dual Time", itemNumber: "366302579143" },
  { name: "Lancaster Chronograph Yellow 0262", itemNumber: "365283747897" },
  { name: "Lorus Children Watch RZK-067-9", itemNumber: "304336571241" },
  { name: "M&M Ladies 11304", itemNumber: "362559477873" },
  { name: "Mondaine Gruezi A660", itemNumber: "304014256318" },
  { name: "Morgan & Headley Quadriga MH-990", itemNumber: "305162505664" },
  { name: "Morgan & Headley Dual Time MH-520", itemNumber: "302732018764" },
  { name: "OBAKU Ladies Milanese V130LGGMG", itemNumber: "363669836896" },
  { name: "Pierre Cardin Chronograph PC106032F10", itemNumber: "306498266952" },
  {
    name: "Quality Time Ladies Milanese QLS-30405-11M",
    itemNumber: "303601443462",
  },
  { name: "Q&Q World Time MDV2-302", itemNumber: "306352867853" },
  { name: "Osco Ladies Expansion Band SDC", itemNumber: "306418361824" },
  { name: "Revue Thommen Streamline 6510005", itemNumber: "306519399485" },
  { name: "Richter & Söhne Ceramic 1032044", itemNumber: "305606484836" },
  { name: "Rivado Men Anthracite RIGS-30341-52M", itemNumber: "364820068272" },
  { name: "Roamer Dreamline Blue 619.953", itemNumber: "364089617981" },
  { name: "Xemex X-TIDE Automatic 22400.02", itemNumber: "304431378261" },
  {
    name: "Manguun Ladies Milanese MULA-91317-60M",
    itemNumber: "304490463945",
  },
  { name: "Quality Time GPS World Time 80125", itemNumber: "364097129739" },
  { name: "Master Time Radio MTLS-10325", itemNumber: "363571669403" },
  { name: "ETT Solar WOOD EGW-12127-32", itemNumber: "365993067748" },
  {
    name: "ETT Eco Tech Radio-Solar ELS-11269-21M",
    itemNumber: "365574928977",
  },
  { name: "Cerruti 1881 Automatic CRA074C2731", itemNumber: "364677918328" },
  { name: "Sinar Digital LED UE-30-5", itemNumber: "306307722714" },
  { name: "Bruno Banani ZENO BR20994", itemNumber: "306396274364" },
  { name: "Swiss Military Patrol 05-5198.55", itemNumber: "306693030160" },
  { name: "Cavadini Skeleton CV-4837-7040", itemNumber: "365887736960" },
  { name: "Cavadini Aquila UNITAS CV-1301", itemNumber: "302742205660" },
];

// ── Config ────────────────────────────────────────────────────────────────────
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "products");
const DELAY_MS = 1500; // wait between requests to be polite to eBay
const MAX_IMAGES = 3; // max images to download per product (first N)

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
      (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchPage(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      },
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(destPath);
          return downloadFile(res.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      },
    );
    req.on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error("Download timeout"));
    });
  });
}

function extractImageUrls(html) {
  const imageUrls = new Set();

  // Method 1: Look for maxImageUrl in JSON blobs (most reliable)
  const maxImageMatches = html.matchAll(/"maxImageUrl"\s*:\s*"([^"]+)"/g);
  for (const m of maxImageMatches) {
    imageUrls.add(m[1].replace(/\\u002F/g, "/"));
  }

  // Method 2: Look for s-l1600 image URLs directly
  const slMatches = html.matchAll(
    /https:\/\/i\.ebayimg\.com\/images\/g\/[^"'\s]+s-l1600\.[a-z]+/g,
  );
  for (const m of slMatches) {
    imageUrls.add(m[0]);
  }

  // Method 3: Look for image data in window.__LISTING_CONTEXT__ or similar
  const imgArrayMatch = html.match(/"image"\s*:\s*\[([^\]]+)\]/);
  if (imgArrayMatch) {
    const urlMatches = imgArrayMatch[1].matchAll(
      /"(https:\/\/i\.ebayimg[^"]+)"/g,
    );
    for (const m of urlMatches) {
      imageUrls.add(m[1]);
    }
  }

  // Method 4: og:image meta tag as fallback
  const ogMatch = html.match(
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
  );
  if (ogMatch) {
    // Convert to highest resolution
    const highRes = ogMatch[1].replace(/s-l\d+/, "s-l1600");
    imageUrls.add(highRes);
  }

  // Filter to only eBay image CDN URLs and clean them up
  return [...imageUrls]
    .filter((url) => url.includes("ebayimg.com") && url.startsWith("http"))
    .map((url) => url.replace(/\\u002F/g, "/").trim())
    .slice(0, MAX_IMAGES);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function scrapeProduct(product) {
  const { name, itemNumber } = product;
  const url = `https://www.ebay.de/itm/${itemNumber}`;
  const productDir = path.join(OUTPUT_DIR, itemNumber);

  // Skip if already downloaded
  if (fs.existsSync(productDir)) {
    const existing = fs
      .readdirSync(productDir)
      .filter((f) => f.match(/\.(jpg|jpeg|png|webp)$/i));
    if (existing.length > 0) {
      console.log(
        `  ⏭  Skipping ${name} — already has ${existing.length} image(s)`,
      );
      return { status: "skipped", itemNumber, name };
    }
  }

  console.log(`  🔍 Fetching listing: ${name} (${itemNumber})`);

  let html;
  try {
    html = await fetchPage(url);
  } catch (err) {
    console.log(`  ❌ Failed to fetch page: ${err.message}`);
    return { status: "failed", itemNumber, name, error: err.message };
  }

  const imageUrls = extractImageUrls(html);

  if (imageUrls.length === 0) {
    console.log(`  ⚠️  No images found for ${name}`);
    return { status: "no_images", itemNumber, name };
  }

  // Create product directory
  fs.mkdirSync(productDir, { recursive: true });

  const downloaded = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    const ext = imgUrl.split(".").pop().split("?")[0] || "jpg";
    const filename = `image_${i + 1}.${ext}`;
    const destPath = path.join(productDir, filename);

    try {
      await downloadFile(imgUrl, destPath);
      downloaded.push(filename);
      console.log(`     ✅ Downloaded: ${filename}`);
    } catch (err) {
      console.log(`     ⚠️  Failed to download image ${i + 1}: ${err.message}`);
    }

    await sleep(300);
  }

  if (downloaded.length === 0) {
    return {
      status: "failed",
      itemNumber,
      name,
      error: "All image downloads failed",
    };
  }

  return { status: "success", itemNumber, name, images: downloaded };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║     Kampfer-Outlet — eBay Image Scraper              ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log(`Products to process: ${PRODUCTS.length}\n`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = { success: [], skipped: [], failed: [], no_images: [] };

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    console.log(`\n[${i + 1}/${PRODUCTS.length}] ${product.name}`);

    const result = await scrapeProduct(product);
    results[result.status]?.push(result) ?? results.failed.push(result);

    // Delay between products to avoid being blocked
    if (i < PRODUCTS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                     SUMMARY                         ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  ✅ Success:   ${results.success.length} products`);
  console.log(
    `  ⏭  Skipped:  ${results.skipped.length} products (already downloaded)`,
  );
  console.log(`  ⚠️  No images: ${results.no_images.length} products`);
  console.log(`  ❌ Failed:    ${results.failed.length} products`);

  if (results.failed.length > 0) {
    console.log("\nFailed products:");
    results.failed.forEach((r) =>
      console.log(`  - ${r.name} (${r.itemNumber}): ${r.error}`),
    );
  }

  if (results.no_images.length > 0) {
    console.log("\nNo images found for:");
    results.no_images.forEach((r) =>
      console.log(`  - ${r.name} (${r.itemNumber})`),
    );
  }

  // Write results to JSON for reference
  const reportPath = path.join(
    process.cwd(),
    "scripts",
    "imageScraperReport.json",
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nFull report saved to: scripts/imageScraperReport.json`);
  console.log(
    "\nDone! Images saved to: public/images/products/<itemNumber>/\n",
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
