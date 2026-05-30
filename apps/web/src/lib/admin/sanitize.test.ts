import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml — XSS defenses", () => {
  it("strips <script> tags", () => {
    const out = sanitizeHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toMatch(/script/i);
    expect(out).toContain("<p>hi</p>");
  });

  it("strips inline event handlers (onerror, onclick)", () => {
    const out = sanitizeHtml(
      '<img src="https://x/a.png" onerror="alert(1)" /><a href="#" onclick="alert(2)">x</a>',
    );
    expect(out).not.toMatch(/onerror|onclick/);
  });

  it("strips javascript: URLs in href", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("allows http(s) / mailto / tel URLs", () => {
    const out = sanitizeHtml(
      [
        '<a href="https://example.com">a</a>',
        '<a href="mailto:x@y.com">b</a>',
        '<a href="tel:+15551234">c</a>',
      ].join(""),
    );
    expect(out).toMatch(/href="https:/);
    expect(out).toMatch(/href="mailto:/);
    expect(out).toMatch(/href="tel:/);
  });

  it("strips <iframe>, <object>, <embed>", () => {
    const out = sanitizeHtml(
      '<iframe src="x"></iframe><object data="x"></object><embed src="x" />',
    );
    expect(out).not.toMatch(/iframe|object|embed/i);
  });

  it("rejects data: URLs on <img src>", () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const out = sanitizeHtml(`<img src="${dataUrl}" alt="x" />`);
    expect(out).not.toMatch(/data:/i);
  });

  it("keeps https: URLs on <img src>", () => {
    const out = sanitizeHtml(
      '<img src="https://blob.vercel.com/articles/a.png" alt="cover" />',
    );
    expect(out).toMatch(/src="https:/);
    expect(out).toMatch(/alt="cover"/);
  });
});

describe("sanitizeHtml — preserves intentional formatting from external paste", () => {
  it("keeps colour, background-color, font-size, font-weight", () => {
    const out = sanitizeHtml(
      '<p style="color: red; background-color: yellow; font-size: 18px; font-weight: 600">hi</p>',
    );
    expect(out).toMatch(/color:\s*red/i);
    expect(out).toMatch(/background-color:\s*yellow/i);
    expect(out).toMatch(/font-size:\s*18px/i);
    expect(out).toMatch(/font-weight:\s*600/i);
  });

  it("keeps font-family and line-height (common WeChat / Word output)", () => {
    const out = sanitizeHtml(
      '<p style="font-family: Helvetica; line-height: 1.6">hi</p>',
    );
    expect(out).toMatch(/font-family:\s*Helvetica/i);
    expect(out).toMatch(/line-height:\s*1\.6/i);
  });

  it("keeps text-align (TipTap TextAlign extension output)", () => {
    const out = sanitizeHtml('<p style="text-align: center">hi</p>');
    expect(out).toMatch(/text-align:\s*center/i);
  });

  it("drops style declarations containing url() (no external fetch)", () => {
    const out = sanitizeHtml(
      '<p style="background-color: red; background: url(http://evil.com/track.png)">hi</p>',
    );
    expect(out).not.toMatch(/url\(/i);
    // background-color value still survives
    expect(out).toMatch(/background-color:\s*red/i);
  });

  it("drops style declarations containing expression() (legacy IE)", () => {
    const out = sanitizeHtml(
      '<p style="width: expression(alert(1))">hi</p>',
    );
    expect(out).not.toMatch(/expression\(/i);
  });
});

describe("sanitizeHtml — link hardening", () => {
  it("adds target=_blank + rel=noopener noreferrer on external links", () => {
    const out = sanitizeHtml('<a href="https://example.com">click</a>');
    expect(out).toMatch(/target="_blank"/);
    expect(out).toMatch(/rel="noopener noreferrer"/);
  });

  it("does NOT add target/rel on internal anchor links", () => {
    const out = sanitizeHtml('<a href="#section">internal</a>');
    expect(out).not.toMatch(/target="_blank"/);
  });
});

describe("sanitizeHtml — happy paths preserved", () => {
  it("keeps headings / paragraphs / lists / blockquote / hr / code", () => {
    const input = [
      "<h2>Heading</h2>",
      "<p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>",
      "<ul><li>one</li><li>two</li></ul>",
      "<blockquote>quote</blockquote>",
      "<hr />",
      "<pre><code>const x = 1;</code></pre>",
    ].join("");
    const out = sanitizeHtml(input);
    expect(out).toContain("<h2>Heading</h2>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>one</li>");
    expect(out).toContain("<blockquote>quote</blockquote>");
    expect(out).toContain("<hr");
    expect(out).toContain("<code>const x = 1;</code>");
  });

  it("keeps <mark> with allowed inline style", () => {
    const out = sanitizeHtml(
      '<p>see <mark style="background-color: #fef08a">this</mark></p>',
    );
    expect(out).toMatch(/<mark[^>]*>/);
    expect(out).toMatch(/background-color:\s*#fef08a/i);
  });

  it("allowImages:false strips img/figure/figcaption", () => {
    const input = '<figure><img src="https://x/a.png" alt="a" /><figcaption>hi</figcaption></figure>';
    const out = sanitizeHtml(input, { allowImages: false });
    expect(out).not.toMatch(/<img|<figure|<figcaption/);
  });
});
