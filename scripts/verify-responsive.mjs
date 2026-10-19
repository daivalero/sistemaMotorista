import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const outDir = "/tmp/sistema-motorista-screens";
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

const page = await browser.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

async function shot(name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function overflow() {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowing: doc.scrollWidth > doc.clientWidth + 2,
    };
  });
}

async function clickText(text, selector = "button") {
  const clicked = await page.evaluate((needle, sel) => {
    const nodes = [...document.querySelectorAll(sel)];
    const match = nodes.find((node) => node.textContent.replace(/\s+/g, " ").includes(needle));
    if (!match) return false;
    match.click();
    return true;
  }, text, selector);
  if (!clicked) throw new Error(`Não achei "${text}" em ${selector}`);
}

const report = [];

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto("http://localhost:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector("form");
report.push({ step: "mobile-login", overflow: await overflow(), shot: await shot("01-mobile-login") });

await clickText("Motorista", ".demo-row button");
await clickText("Entrar");
await page.waitForSelector(".status-card");
report.push({ step: "mobile-home", overflow: await overflow(), shot: await shot("02-mobile-home") });

await page.click(".toggle");
await sleep(200);
await page.click(".ride-card");
await page.waitForSelector(".detail-card");
report.push({ step: "mobile-ride-detail", overflow: await overflow(), shot: await shot("03-mobile-ride") });

const action = await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".action-bar button")].find(Boolean);
  if (!btn) return null;
  const label = btn.textContent.trim();
  btn.click();
  return label;
});
await sleep(250);
report.push({ step: "mobile-ride-action", action, overflow: await overflow(), shot: await shot("04-mobile-ride-after-action") });

await page.evaluate(() => {
  const nav = [...document.querySelectorAll(".bottom-nav button")];
  nav.find((btn) => btn.textContent.includes("Corridas"))?.click();
});
await page.waitForSelector(".chips");
await clickText("Histórico");
report.push({ step: "mobile-rides", overflow: await overflow(), shot: await shot("05-mobile-rides") });

await page.evaluate(() => {
  const nav = [...document.querySelectorAll(".bottom-nav button")];
  nav.find((btn) => btn.textContent.includes("Ganhos"))?.click();
});
await page.waitForSelector(".chart-card");
report.push({ step: "mobile-earnings", overflow: await overflow(), shot: await shot("06-mobile-earnings") });

await page.evaluate(() => {
  const nav = [...document.querySelectorAll(".bottom-nav button")];
  nav.find((btn) => btn.textContent.includes("Perfil"))?.click();
});
await page.waitForSelector(".profile-hero");
report.push({ step: "mobile-profile", overflow: await overflow(), shot: await shot("07-mobile-profile") });

const mobileNavVisible = await page.evaluate(() => {
  const nav = document.querySelector(".bottom-nav");
  const side = document.querySelector(".sidebar");
  const navStyle = getComputedStyle(nav);
  const sideStyle = getComputedStyle(side);
  return {
    bottomNav: navStyle.display !== "none",
    sidebar: sideStyle.display !== "none",
  };
});
report.push({ step: "mobile-chrome", mobileNavVisible });

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await page.goto("http://localhost:5173", { waitUntil: "networkidle0" });
await page.waitForSelector(".sidebar");
await clickText("Perfil", ".side-nav button");
await page.waitForSelector(".profile-hero");
const desktopChrome = await page.evaluate(() => {
  const nav = document.querySelector(".bottom-nav");
  const side = document.querySelector(".sidebar");
  return {
    bottomNav: getComputedStyle(nav).display !== "none",
    sidebar: getComputedStyle(side).display !== "none",
  };
});
report.push({
  step: "desktop-profile-chrome",
  desktopChrome,
  overflow: await overflow(),
  shot: await shot("08-desktop-profile"),
});

await clickText("Sair");
await page.waitForSelector("form");
await clickText("Administrador", ".demo-row button");
await clickText("Entrar");
await page.waitForSelector(".stat-grid");
report.push({ step: "desktop-admin", overflow: await overflow(), shot: await shot("09-desktop-admin") });

await clickText("Motoristas", ".side-nav button");
await page.waitForSelector(".data-table");
report.push({ step: "desktop-drivers-table", overflow: await overflow(), shot: await shot("10-desktop-drivers") });

await clickText("Novo");
await page.waitForSelector(".sheet");
const fields = await page.$$(".sheet input, .sheet select");
await fields[0].click({ clickCount: 3 });
await fields[0].type("Teste Mobile");
await fields[1].click({ clickCount: 3 });
await fields[1].type("11999999999");
await fields[2].type("Campinas");
await fields[3].type("123456");
await clickText("Salvar motorista");
await page.waitForFunction(() => document.body.innerText.includes("Teste Mobile"));
report.push({ step: "desktop-driver-created", overflow: await overflow(), shot: await shot("11-desktop-driver-created") });

await clickText("Veículos", ".side-nav button");
await page.waitForSelector(".vehicle-card");
report.push({ step: "desktop-vehicles", overflow: await overflow(), shot: await shot("12-desktop-vehicles") });

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(300);
await page.evaluate(() => {
  const nav = [...document.querySelectorAll(".bottom-nav button")];
  nav.find((btn) => btn.textContent.includes("Motoristas"))?.click();
});
await page.waitForSelector(".data-table");
const adminMobileChrome = await page.evaluate(() => ({
  bottomNav: getComputedStyle(document.querySelector(".bottom-nav")).display !== "none",
  sidebar: getComputedStyle(document.querySelector(".sidebar")).display !== "none",
  stackedRows: getComputedStyle(document.querySelector(".data-table thead")).display === "none",
}));
report.push({
  step: "mobile-admin-drivers",
  adminMobileChrome,
  overflow: await overflow(),
  shot: await shot("13-mobile-admin-drivers"),
});

await clickText("Novo");
await page.waitForSelector(".sheet");
report.push({ step: "mobile-admin-sheet", overflow: await overflow(), shot: await shot("14-mobile-admin-sheet") });

await browser.close();

const overflowing = report.filter((item) => item.overflow?.overflowing);
const result = { errors, overflowing, report };
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (errors.length || overflowing.length) process.exitCode = 1;
