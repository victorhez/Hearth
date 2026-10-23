// Shared session helper. Works in both modes:
//   accounts off (default): optional shared token + x-household header (local use)
//   accounts on:            signed token in localStorage; the server decides the household
export async function session({ mode = "app" } = {}) {
  const qs = new URLSearchParams(location.search);
  const cfg = await fetch("/api/config").then((r) => r.json()).catch(() => ({ accounts: false }));
  const household = qs.get("household") || (mode === "kitchen" ? "kitchen" : "home");
  const key = mode === "kitchen" ? "hl-kitchen-token" : "hl-token"; // the kitchen demo never touches a real family's data
  let token = qs.get("token") || localStorage.getItem(key) || "", me = null;
  if (cfg.accounts) {
    if (token) {
      const probe = await fetch("/api/archive", { headers: { authorization: "Bearer " + token } });
      if (probe.ok) { const r = await fetch("/api/auth/me", { headers: { authorization: "Bearer " + token } }); if (r.ok) me = await r.json(); }
      else { token = ""; localStorage.removeItem(key); }
    }
    if (!token && mode === "kitchen") {
      const j = await fetch("/api/auth/demo", { method: "POST" }).then((r) => r.json());
      token = j.token; localStorage.setItem(key, token); me = { user: j.user, household: j.household, members: [] };
    }
    if (!token && mode === "app") { location.href = "/account.html?next=" + encodeURIComponent(location.pathname + location.search); await new Promise(() => {}); }
  }
  const headers = { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}), ...(cfg.accounts ? {} : { "x-household": household }) };
  return { cfg, token, headers, household, me };
}
