/**
 * HTTP smoke test against a running instance (dev or production build).
 *
 *   npm run build && npm run start      # in one terminal
 *   npm run test:smoke                  # in another (BASE_URL defaults to http://localhost:3000)
 *
 * It checks public pages, SEO output, security headers, and that admin-only
 * routes reject anonymous requests. It does not sign in or change any data.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function get(path: string) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const body = await res.text();
  return { res, body };
}

async function main() {
  const home = await get("/");
  check("home page responds 200", home.res.status === 200, String(home.res.status));
  check("home has exactly one <h1>", (home.body.match(/<h1[\s>]/g) ?? []).length === 1);
  check("home has <title> and meta description", /<title>[^<]+<\/title>/.test(home.body) && /<meta name="description" content="[^"]+"/.test(home.body));
  check("home has canonical link", /<link rel="canonical" href="[^"]+"/.test(home.body));
  check("home has Open Graph + Twitter tags", /property="og:title"/.test(home.body) && /name="twitter:card"/.test(home.body));

  const ld = [...home.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let ldTypes: string[] = [];
  try {
    ldTypes = ld.flatMap((raw) => {
      const data = JSON.parse(raw);
      return (data["@graph"] ?? [data]).map((node: { "@type": string }) => node["@type"]);
    });
  } catch {
    check("home JSON-LD parses", false);
  }
  check("home JSON-LD includes Person, WebSite, WebPage", ["Person", "WebSite", "WebPage"].every((t) => ldTypes.includes(t)), ldTypes.join(", "));

  for (const header of ["x-content-type-options", "x-frame-options", "referrer-policy", "strict-transport-security"]) {
    check(`security header ${header}`, home.res.headers.has(header));
  }

  const robots = await get("/robots.txt");
  check("robots.txt disallows /admin", robots.res.status === 200 && /Disallow: \/admin/.test(robots.body));

  const sitemap = await get("/sitemap.xml");
  const projectUrls = [...sitemap.body.matchAll(/<loc>([^<]*\/projects\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  check("sitemap.xml lists project pages", sitemap.res.status === 200 && projectUrls.length > 0, `${projectUrls.length} project URLs`);
  check("sitemap.xml excludes admin and preview", !/\/admin|\/preview/.test(sitemap.body));

  const list = await get("/projects");
  check("/projects responds 200", list.res.status === 200);

  if (projectUrls[0]) {
    const path = new URL(projectUrls[0]).pathname;
    const project = await get(path);
    check(`${path} responds 200`, project.res.status === 200);
    check("project page has BreadcrumbList JSON-LD", /"@type":"BreadcrumbList"/.test(project.body));
  }

  const missing = await get("/this-page-does-not-exist");
  check("unknown path returns 404", missing.res.status === 404, String(missing.res.status));

  const admin = await get("/admin");
  check("/admin redirects anonymous visitors to login", [302, 303, 307, 308].includes(admin.res.status) && (admin.res.headers.get("location") ?? "").includes("/admin/login"), String(admin.res.status));

  const login = await get("/admin/login");
  check("admin pages send X-Robots-Tag noindex", (login.res.headers.get("x-robots-tag") ?? "").includes("noindex"));

  const exportCsv = await get("/api/leads/export");
  check("lead export rejects anonymous requests", exportCsv.res.status === 401, String(exportCsv.res.status));

  const preview = await get("/preview");
  check("/preview is not available anonymously", preview.res.status !== 200, String(preview.res.status));

  console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(`Could not reach ${BASE} — is the server running?`, error instanceof Error ? error.message : error);
  process.exit(1);
});
