import { toPng } from "html-to-image";

const loadImage = src =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const downloadTableAsImage = async (node, filename = "classement") => {
  // Hide interactive controls inside the captured area
  const ignored = [...node.querySelectorAll("[data-export-ignore]")];
  ignored.forEach(el => (el.style.display = "none"));

  // Strip shadows/filters so the PNG stays clean
  const style = document.createElement("style");
  style.textContent =
    ".fa-exporting, .fa-exporting * { box-shadow: none !important; text-shadow: none !important; filter: none !important; }";
  document.head.appendChild(style);
  node.classList.add("fa-exporting");

  const cleanup = () => {
    node.classList.remove("fa-exporting");
    style.remove();
    ignored.forEach(el => (el.style.display = ""));
  };

  const [tableDataUrl, logo] = await Promise.all([
    toPng(node, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    }),
    loadImage("/fa-logo-dark-long.png"),
  ]).finally(cleanup);
  const tableImg = await loadImage(tableDataUrl);

  const pad = 48;
  const headerH = 150;
  const footerH = 64;
  const logoH = 96;
  const logoW = logoH * (logo.width / logo.height);

  const width = Math.max(tableImg.width + pad * 2, logoW + pad * 2);
  const height = headerH + tableImg.height + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Header: logo centered
  const lx = (width - logoW) / 2;
  const ly = (headerH - logoH) / 2;
  ctx.drawImage(logo, lx, ly, logoW, logoH);

  // Emerald divider under header
  ctx.fillStyle = "#047857";
  ctx.fillRect(pad, headerH - 2, width - pad * 2, 3);

  // Table image
  const tx = (width - tableImg.width) / 2;
  ctx.drawImage(tableImg, tx, headerH, tableImg.width, tableImg.height);

  // Footer caption
  ctx.fillStyle = "#6b7280";
  ctx.font = "500 22px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `Football Autopsie — ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
    width / 2,
    headerH + tableImg.height + footerH / 2 + 8
  );

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
};
