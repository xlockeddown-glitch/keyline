#!/usr/bin/env node
/**
 * Signed-in stand-in for qa:deal-repeats. Mints the same EdDSA viewer token the gate
 * would, and serves the JWKS the dev server fetches when GROK_GATE_ORIGIN points here.
 *
 *   node scripts/gate-standin.mjs
 *   GROK_GATE_ORIGIN=http://127.0.0.1:8163 npm run dev
 *   node scripts/qa-deal-repeats.mjs http://127.0.0.1:8080 --gate http://127.0.0.1:8163
 *
 *   GET /mint?sub=&name=&email=   → token text (audience preview, issuer this origin)
 *   GET /__gate/identity-key      → { keys: [public jwk] }
 */
import { createServer } from "node:http";
import { generateKeyPairSync } from "node:crypto";
import { SignJWT, exportJWK } from "jose";

const PORT = Number(process.env.PORT || 8163);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const jwk = { ...(await exportJWK(publicKey)), alg: "EdDSA", use: "sig", kid: "qa-gate" };

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  if (url.pathname === "/__gate/identity-key") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ keys: [jwk] }));
    return;
  }
  if (url.pathname === "/mint") {
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: url.searchParams.get("sub") || "qa" };
    const email = url.searchParams.get("email");
    const name = url.searchParams.get("name");
    if (email) claims.email = email;
    if (name) claims.name = name;
    const token = await new SignJWT(claims)
      .setProtectedHeader({ alg: "EdDSA", kid: "qa-gate" })
      .setIssuer(ORIGIN)
      .setAudience("preview")
      .setIssuedAt(now)
      .setExpirationTime(now + 10 * 60)
      .sign(privateKey);
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(token);
    return;
  }
  res.statusCode = 404;
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[gate-standin] ${ORIGIN}`);
});
