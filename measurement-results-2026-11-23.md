# RareWolf production measurement log

Date (client context): 2026-11-23
Target scope: rarewolf.online only. No other domain contacted. No non-GET production requests made.

## External reachability probes (raw outcome)
Attempted GETs using PowerShell Invoke-WebRequest, timeout 20s:
- https://rarewolf.online/ -> ERROR: No such host is known. (rarewolf.online:443)
- https://rarewolf.online/api/products -> ERROR: No such host is known. (rarewolf.online:443)
- https://rarewolf.online/api/categories -> ERROR: No such host is known. (rarewolf.online:443)

Result: DNS resolution failed from this execution environment before an HTTP/TLS connection. No load test was started. No product detail ID could be retrieved. All external metrics below are NOT MEASURED.

## Production frontend build artifact (local)
Command: npm run build (cwd: client)
Build output files observed in client/dist/assets:
- index-cPMv0zBt.js: raw 646,199 bytes; gzip 186,974 bytes
- index-gQlfkhnm.css: raw 45,109 bytes; gzip 8,164 bytes
- JS + CSS total: raw 691,308 bytes; gzip 195,138 bytes (190.6 KiB)
Method: local Vite production output; gzip sizes independently calculated with .NET GZipStream, Optimal compression. This is an offline artifact compression measurement, not a measurement of bytes served by rarewolf.online.

## Source-code inspection (local repository)
- API mount prefix in server/src/app.js: /api/v1; supplied /api/products and /api/categories paths do not match this source mount prefix.
- Product detail handler is GET /api/v1/products/:slug (slug route); no product ID was supplied/observed.
- Catalog GET endpoints use Joi pagination: page default 1, limit default 12, maximum 50. Product query uses MongoDB skip/limit and countDocuments.
- CORS middleware is configured in server/src/app.js using CORS_ORIGIN allowlist.
- Rate limit middleware is applied to auth routes only; catalog routes have no rate limiter in source.
- No Helmet or compression middleware/package found in server/package.json or server/src/app.js.
- Source MongoDB indexes: products (isActive, category, price) and text (name, description); categories (isActive, name); orders (user, createdAt). These are schema declarations, not live DB index/collection measurements.

## EC2/live-host measurements
No SSH session or EC2 read-only output was available in this environment. Deployment guide states a t3.small example/initial selection, but that is documentation and not verified live instance state.
