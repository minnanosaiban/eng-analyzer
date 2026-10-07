// 英文構造アナライザー: クラウド同期 API
// - 静的ファイルは assets から配信し、/api/* だけこの Worker が処理する
// - データは端末側で暗号化済み。サーバーは暗号文を保存・返却するだけで中身は読めない
// - 認証は同期キー "保管庫ID.秘密" を Authorization: Bearer で送る。秘密は SHA-256 で照合

const MAX_BODY = 8 * 1024 * 1024;
const PAGE = 300;
const KINDS = new Set(["item", "word", "group"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const fail = (status, message) => json({ error: message }, status);

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sha256hex(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sameHex(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  return x.length === y.length && crypto.subtle.timingSafeEqual(x, y);
}

async function readJson(request) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) throw new Error("too large");
  const text = await request.text();
  if (text.length > MAX_BODY) throw new Error("too large");
  return JSON.parse(text);
}

async function auth(request, env) {
  const m = (request.headers.get("authorization") || "").match(/^Bearer ([\w-]{8,64})\.([\w-]{20,128})$/);
  if (!m) return null;
  const v = await env.DB.prepare("SELECT * FROM vaults WHERE id = ?").bind(m[1]).first();
  if (!v || !sameHex(await sha256hex(m[2]), v.key_hash)) return null;
  return v;
}

const isStr = (s, max) => typeof s === "string" && s.length > 0 && s.length <= max;

async function createVault(request, env) {
  const body = await readJson(request);
  if (!isStr(body.salt, 64) || !isStr(body.check_iv, 64) || !isStr(body.check_data, 512)) return fail(400, "bad request");
  // 公開 URL なので、持ち主以外が先に作成できないようセットアップコードを要求する
  if (env.SETUP_CODE && !(typeof body.setup === "string" && sameHex(await sha256hex(body.setup), await sha256hex(env.SETUP_CODE))))
    return fail(403, "セットアップコードが正しくありません。");
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM vaults").first();
  if (n >= Number(env.MAX_VAULTS || 1)) return fail(403, "このサーバーでは新しい同期を作成できません(作成済みです)。");
  const id = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const secret = b64url(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare("INSERT INTO vaults (id, key_hash, salt, check_iv, check_data, seq, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)")
    .bind(id, await sha256hex(secret), body.salt, body.check_iv, body.check_data, Date.now()).run();
  return json({ token: `${id}.${secret}` }, 201);
}

async function pull(url, env, v) {
  const since = Math.max(0, Number(url.searchParams.get("since")) || 0);
  const { results } = await env.DB.prepare(
    "SELECT kind, id, iv, data, deleted, seq FROM records WHERE vault = ? AND seq > ? ORDER BY seq LIMIT ?"
  ).bind(v.id, since, PAGE + 1).all();
  const more = results.length > PAGE;
  return json({ records: results.slice(0, PAGE), more });
}

async function push(request, env, v) {
  const body = await readJson(request);
  const recs = Array.isArray(body.records) ? body.records : [];
  if (!recs.length || recs.length > 200) return fail(400, "records must be 1..200");
  for (const r of recs) {
    if (!KINDS.has(r.kind) || !isStr(r.id, 64)) return fail(400, "bad record");
    if (!r.deleted && (!isStr(r.iv, 64) || !isStr(r.data, 2_000_000))) return fail(400, "bad record data");
  }
  // 保管庫の通し番号を進め、この送信分すべてに同じ番号を付ける
  const { seq } = await env.DB.prepare("UPDATE vaults SET seq = seq + 1 WHERE id = ? RETURNING seq").bind(v.id).first();
  const stmt = env.DB.prepare(
    `INSERT INTO records (vault, kind, id, iv, data, deleted, seq) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (vault, kind, id) DO UPDATE SET iv = excluded.iv, data = excluded.data, deleted = excluded.deleted, seq = excluded.seq`
  );
  await env.DB.batch(recs.map((r) => stmt.bind(v.id, r.kind, r.id, r.deleted ? null : r.iv, r.deleted ? null : r.data, r.deleted ? 1 : 0, seq)));
  return json({ seq });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS ? env.ASSETS.fetch(request) : fail(404, "not found");
    try {
      if (url.pathname === "/api/vault" && request.method === "POST") return await createVault(request, env);
      const v = await auth(request, env);
      if (!v) return fail(401, "同期キーが正しくありません。");
      if (url.pathname === "/api/vault" && request.method === "GET")
        return json({ salt: v.salt, check_iv: v.check_iv, check_data: v.check_data, seq: v.seq });
      if (url.pathname === "/api/records" && request.method === "GET") return await pull(url, env, v);
      if (url.pathname === "/api/records" && request.method === "POST") return await push(request, env, v);
      return fail(404, "not found");
    } catch (e) {
      return fail(e.message === "too large" ? 413 : 400, "リクエストを処理できませんでした。");
    }
  },
};
