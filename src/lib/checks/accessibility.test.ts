import { describe, expect, it } from "vitest";
import { accessibilityChecks } from "./accessibility";
import { find, page } from "./testUtils";

const check = (id: string, body: string, htmlAttributes = 'lang="en"') =>
  find(accessibilityChecks(page(`<html ${htmlAttributes}><body>${body}</body></html>`)), id);

describe("image alt text", () => {
  it.each([
    '<img src="a.png" alt="A cake">',
    '<img src="a.png" alt="">', // decorative
    '<img src="a.png" role="presentation">',
    '<img src="a.png" aria-hidden="true">',
    '<div aria-hidden="true"><img src="a.png"></div>',
  ])("accepts %s", (body) => {
    expect(check("accessibility.img-alt.missing", body).passed).toBe(true);
  });

  it("lists images without alt", () => {
    expect(check("accessibility.img-alt.missing", '<img src="a.png"><img src="b.png">')).toMatchObject({
      passed: false,
      evidence: { count: 2, examples: ['<img src="a.png">', '<img src="b.png">'] },
    });
  });
});

describe("form labels", () => {
  it.each([
    '<label for="e">Email</label><input id="e">',
    "<label>Email <input></label>",
    '<input aria-label="Email">',
    '<span id="l">Email</span><input aria-labelledby="l">',
    '<input title="Search">',
    '<input type="hidden" name="t">',
    '<input type="submit">',
    '<input type="text" hidden>',
  ])("accepts %s", (body) => {
    expect(check("accessibility.form-label.missing", body).passed).toBe(true);
  });

  it("does not count a placeholder as a label", () => {
    expect(check("accessibility.form-label.missing", '<input placeholder="Email" name="email">')).toMatchObject({
      passed: false,
      evidence: { count: 1, examples: ['<input name="email">'] },
    });
  });

  it("flags unlabeled select and textarea", () => {
    expect(check("accessibility.form-label.missing", "<select></select><textarea></textarea>")).toMatchObject({
      passed: false,
      evidence: { count: 2 },
    });
  });

  it("handles ids with characters that would break a CSS selector", () => {
    expect(check("accessibility.form-label.missing", '<label for="a\\"]b">Name</label><input id="a\\"]b">').passed).toBe(true);
  });
});

describe("link and button names", () => {
  it.each([
    '<a href="/">Home</a>',
    '<a href="/"><img src="l.png" alt="Home"></a>',
    '<a href="/" aria-label="Home"><svg></svg></a>',
    '<a href="/"><svg><title>Home</title></svg></a>',
    '<a href="/"><span aria-label="Home"></span></a>',
    '<a href="/" aria-hidden="true"></a>',
    "<a>not a link without href</a>",
  ])("accepts link %s", (body) => {
    expect(check("accessibility.link-name.missing", body).passed).toBe(true);
  });

  it("flags empty links and image links without alt", () => {
    expect(check("accessibility.link-name.missing", '<a href="/cart"></a><a href="/"><img src="x.png"></a>')).toMatchObject({
      passed: false,
      evidence: { count: 2 },
    });
  });

  it.each([
    "<button>Send</button>",
    '<button aria-label="Close"><svg></svg></button>',
    '<div role="button">Open</div>',
    '<input type="submit">',
    '<input type="image" src="go.png" alt="Search">',
  ])("accepts button %s", (body) => {
    expect(check("accessibility.button-name.missing", body).passed).toBe(true);
  });

  it("flags empty buttons and image inputs without alt", () => {
    expect(
      check("accessibility.button-name.missing", '<button><i class="icon"></i></button><input type="image" src="go.png">'),
    ).toMatchObject({ passed: false, evidence: { count: 2 } });
  });
});

describe("page language", () => {
  it("flags a missing or empty lang", () => {
    expect(check("accessibility.lang.missing", "", "")).toMatchObject({ passed: false, evidence: { lang: null } });
    expect(check("accessibility.lang.missing", "", 'lang=" "').passed).toBe(false);
    expect(check("accessibility.lang.missing", "", 'lang="ar"')).toMatchObject({ passed: true, evidence: { lang: "ar" } });
  });
});
