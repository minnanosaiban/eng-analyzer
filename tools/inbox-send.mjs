#!/usr/bin/env node
// 英文構造アナライザーの「受信箱」に、英文を預けるスクリプト(Claude Code などから使う)
//
//   node tools/inbox-send.mjs <ファイル> [--group グループ名] [--config 設定ファイル] [--dry-run]
//
//   ファイル: .csv(1列目=英文、2列目=グループ名。「、」区切りで複数可) / .txt(1行=1文) /
//             .json(アプリの「バックアップ保存」と同じ形。解析済みのデータもそのまま送れる)
//
// 設定ファイル(既定: tools/inbox.json)は、アプリの「設定 → 受信箱」で発行します。
//   { "url": "https://…", "token": "保管庫ID.秘密", "pub": "公開鍵(base64)" }
// token は「預けること」しかできません(読み出しはできない)。pub は、送る前に英文を暗号化するための公開鍵です。
// 英文は、この PC で暗号化してから送ります。サーバーにも、通信の途中にも、平文は流れません。
//
// Node.js 18 以降で動きます(追加のライブラリは不要)。

import { readFileSync, existsSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname } from "node:path";

const { subtle } = webcrypto;
const here = dirname(fileURLToPath(import.meta.url));
const MAX_CHUNK = 400_000; // 1通の平文の目安(サーバーの上限は暗号化後 約1.1MB)

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? (args.splice(i, 1), true) : false; };
const opt = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v ?? null; };
const dryRun = flag("--dry-run");
const group = opt("--group");
const configPath = resolve(opt("--config") ?? resolve(here, "inbox.json"));
const file = args[0];
if (!file) { console.error("使い方: node tools/inbox-send.mjs <ファイル> [--group グループ名] [--dry-run]"); process.exit(2); }

// ---- 入力を、バックアップと同じ形 {groups, items, words} にそろえる ----
function parseCsvLine(l) {
  const m = l.match(/^\s*("([^"]*(?:""[^"]*)*)"|[^,]*)\s*(?:,\s*(.*))?$/);
  if (!m) return { text: l, group: "" };
  return { text: m[2] !== undefined ? m[2].replace(/""/g, '"') : m[1], group: (m[3] || "").replace(/^"|"$/g, "") };
}
function fromRows(rows) {
  const groups = [], gid = {};
  const G = (n) => (gid[n] ||= (groups.push({ id: "g" + (groups.length + 1), name: n }), "g" + groups.length));
  const items = [];
  for (const r of rows) {
    const text = (r.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const names = (r.group || group || "").split(/[,、;]/).map((s) => s.trim()).filter(Boolean);
    items.push({ text, gids: names.map(G) });
  }
  return { groups, items, words: [] };
}
function load(path) {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "");
  const ext = extname(path).toLowerCase();
  if (ext === ".json") {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") throw new Error("JSON の形が違います");
    const data = { groups: d.groups || [], items: d.items || [], words: d.words || [] };
    if (group) { // --group があれば、グループの付いていない英文に付ける
      const g = data.groups.find((x) => x.name === group) || (data.groups.push({ id: "g_cli", name: group }), data.groups.at(-1));
      for (const i of data.items) if (!i.gids?.length) i.gids = [g.id];
    }
    return data;
  }
  const lines = raw.split(/\r?\n/);
  return fromRows(ext === ".csv" ? lines.map(parseCsvLine) : lines.map((text) => ({ text })));
}

// ---- 大きすぎる荷物は、何通かに分ける(グループの一覧は毎回つける)----
function chunk(data) {
  const out = []; let cur = { groups: data.groups, items: [], words: [] }, size = 0;
  const flush = () => { if (cur.items.length || cur.words.length) out.push(cur); cur = { groups: data.groups, items: [], words: [] }; size = 0; };
  for (const [key, list] of [["items", data.items], ["words", data.words]])
    for (const o of list) { const s = JSON.stringify(o).length; if (size + s > MAX_CHUNK) flush(); cur[key].push(o); size += s; }
  flush();
  return out;
}

// ---- 暗号化: 1通ごとの AES 鍵を作り、本文を AES-GCM で暗号化。AES 鍵は公開鍵(RSA-OAEP)で包む ----
const b64 = (u8) => Buffer.from(u8).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
async function seal(payload, pubKey) {
  const aes = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const data = await subtle.encrypt({ name: "AES-GCM", iv }, aes, new TextEncoder().encode(JSON.stringify(payload)));
  const wrapped = await subtle.encrypt({ name: "RSA-OAEP" }, pubKey, await subtle.exportKey("raw", aes));
  return { wrapped: b64(new Uint8Array(wrapped)), iv: b64(iv), data: b64(new Uint8Array(data)) };
}

// ---- 実行 ----
const data = load(resolve(file));
const parts = chunk(data);
const nItems = data.items.length, nWords = data.words.length;
console.log(`読み込み: 英文 ${nItems} / 単語 ${nWords} / グループ ${data.groups.length} → ${parts.length} 通`);
if (!nItems && !nWords) { console.error("送るものがありません。"); process.exit(1); }
if (dryRun) { console.log("(--dry-run: 送信はしません)"); process.exit(0); }

if (!existsSync(configPath)) {
  console.error(`設定ファイルがありません: ${configPath}\nアプリの「設定 → クラウド同期 → 受信箱」で発行し、このパスに保存してください。`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(configPath, "utf8"));
for (const k of ["url", "token", "pub"]) if (!cfg[k]) { console.error(`設定ファイルに ${k} がありません。`); process.exit(1); }
const pubKey = await subtle.importKey("spki", unb64(cfg.pub), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);

let sent = 0;
for (const [i, p] of parts.entries()) {
  const body = await seal(p, pubKey);
  const r = await fetch(new URL("/api/inbox", cfg.url), {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + cfg.token }, body: JSON.stringify(body),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    console.error(`送信できませんでした(${i + 1}/${parts.length} 通目、HTTP ${r.status}): ${j.error || ""}`);
    process.exit(1);
  }
  sent += p.items.length;
  console.log(`  ${i + 1}/${parts.length} 通目を預けました`);
}
console.log(`完了: 英文 ${sent} 文を預けました。アプリを開く(または同期する)と、自動で登録されます。`);
