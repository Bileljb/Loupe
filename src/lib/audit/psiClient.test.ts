import { describe, expect, it, vi } from "vitest";
import { fixture } from "@/lib/checks/testUtils";
import { buildPsiUrl, fetchPsi, PsiError, type PsiErrorCode } from "./psiClient";

const KEY = "test-key-not-real";
const SITE = "https://rosas-bakery.example/";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const fakeFetch = (respond: () => Promise<Response>) => vi.fn<typeof fetch>(respond);

async function expectCode(promise: Promise<unknown>, code: PsiErrorCode) {
  const error = await promise.then(
    () => {
      throw new Error("expected a PsiError");
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(PsiError);
  expect((error as PsiError).code).toBe(code);
  // Neither the key nor upstream text leaks into the error.
  expect((error as PsiError).message).toBe(code);
}

describe("buildPsiUrl", () => {
  it("asks for a mobile run with all four categories", () => {
    const url = new URL(buildPsiUrl(SITE, KEY));
    expect(url.searchParams.get("url")).toBe(SITE);
    expect(url.searchParams.get("strategy")).toBe("MOBILE");
    expect(url.searchParams.getAll("category")).toEqual(["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]);
    expect(url.searchParams.get("key")).toBe(KEY);
  });

  it("omits the key when none is set", () => {
    expect(new URL(buildPsiUrl(SITE)).searchParams.has("key")).toBe(false);
  });
});

describe("fetchPsi", () => {
  it("returns the parsed response", async () => {
    const fetchImpl = fakeFetch(async () => new Response(fixture("psi/example-com.json")));
    const result = await fetchPsi(SITE, { apiKey: KEY, fetchImpl });
    expect(result.lighthouseResult.categories.performance.score).toBe(1);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("reports quota errors", async () => {
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl: fakeFetch(async () => json({}, 429)) }), "PSI_QUOTA");
    const forbidden = json({ error: { code: 403, message: `quota for key ${KEY}`, errors: [{ reason: "dailyLimitExceeded" }] } }, 403);
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl: fakeFetch(async () => forbidden) }), "PSI_QUOTA");
    const exhausted = json({ error: { status: "RESOURCE_EXHAUSTED" } }, 403);
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl: fakeFetch(async () => exhausted) }), "PSI_QUOTA");
  });

  it("reports other non-200 responses as failed", async () => {
    const lighthouseError = json({ error: { code: 500, message: "Lighthouse returned error: FAILED_DOCUMENT_REQUEST" } }, 500);
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl: fakeFetch(async () => lighthouseError) }), "PSI_FAILED");
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl: fakeFetch(async () => json({}, 403)) }), "PSI_FAILED");
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl: fakeFetch(async () => json({}, 400)) }), "PSI_FAILED");
  });

  it("reports network errors as failed", async () => {
    const fetchImpl = fakeFetch(async () => {
      throw new TypeError("fetch failed");
    });
    await expectCode(fetchPsi(SITE, { apiKey: KEY, fetchImpl }), "PSI_FAILED");
  });

  it("times out", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    await expectCode(fetchPsi(SITE, { apiKey: KEY, timeoutMs: 20, fetchImpl }), "PSI_TIMEOUT");
  });

  it("rejects bodies that aren't JSON or don't match the schema", async () => {
    await expectCode(fetchPsi(SITE, { fetchImpl: fakeFetch(async () => new Response("<html>")) }), "PSI_INVALID_RESPONSE");
    await expectCode(fetchPsi(SITE, { fetchImpl: fakeFetch(async () => json({ kind: "x" })) }), "PSI_INVALID_RESPONSE");
  });

  it("treats a Lighthouse runtime error or a missing performance score as failed", async () => {
    const base = JSON.parse(fixture("psi/example-com.json"));
    const withRuntimeError = structuredClone(base);
    withRuntimeError.lighthouseResult.runtimeError = { code: "NO_FCP", message: "The page did not paint any content." };
    await expectCode(fetchPsi(SITE, { fetchImpl: fakeFetch(async () => json(withRuntimeError)) }), "PSI_FAILED");

    const noScore = structuredClone(base);
    noScore.lighthouseResult.categories.performance.score = null;
    await expectCode(fetchPsi(SITE, { fetchImpl: fakeFetch(async () => json(noScore)) }), "PSI_FAILED");

    const noError = structuredClone(base);
    noError.lighthouseResult.runtimeError = { code: "NO_ERROR" };
    await expect(fetchPsi(SITE, { fetchImpl: fakeFetch(async () => json(noError)) })).resolves.toBeDefined();
  });
});
