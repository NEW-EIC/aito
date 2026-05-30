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
      '<img src="x" onerror="alert(1)" /><a href="#" onclick="alert(2)">x</a>',
    );
    expect(out).not.toMatch(/onerror|onclick/);
  });

  it("strips javascript: URLs in href", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("allows http(s) / mailto / tel / relative URLs", () => {
    const out = sanitizeHtml(
      [
        '<a href="https://example.com">a</a>',
        '<a href="mailto:x@y.com">b</a>',
        '<a href="tel:+15551234">c</a>',
        '<a href="/articles/foo">d</a>',
        '<a href="#anchor">e</a>',
      ].join(""),
    );
    expect(out).toMatch(/href="https:/);
    expect(out).toMatch(/href="mailto:/);
    expect(out).toMatch(/href="tel:/);
    expect(out).toMatch(/href="\/articles/);
    expect(out).toMatch(/href="#anchor/);
  });

  it("strips <iframe>, <object>, <embed>", () => {
    const out = sanitizeHtml(
      '<iframe src="x"></iframe><object data="x"></object><embed src="x" />',
    );
    expect(out).not.toMatch(/iframe|object|embed/i);
  });
});

describe("sanitizeHtml — WeChat / Word paste cleanup", () => {
  it("drops style attributes except text-align / color / background-color", () => {
    const out = sanitizeHtml(
      '<p style="font-family: Helvetica; line-height: 2em; color: red; text-align: center">hi</p>',
    );
    expect(out).toMatch(/color:\s*red/i);
    expect(out).toMatch(/text-align:\s*center/i);
    expect(out).not.toMatch(/font-family/i);
    expect(out).not.toMatch(/line-height/i);
  });

  it("removes the style attribute entirely when nothing survives the allowlist", () => {
    const out = sanitizeHtml(
      '<p style="mso-style-priority:1; font-family: Calibri; font-size: 11pt">hi</p>',
    );
    expect(out).not.toMatch(/style=/);
    expect(out).toContain("hi");
  });

  it("drops style declarations containing url() or expression()", () => {
    const out = sanitizeHtml(
      '<p style="background-color: url(http://evil.com/track.png); color: red">hi</p>',
    );
    expect(out).not.toMatch(/url\(/i);
    expect(out).toMatch(/color:\s*red/i);
  });

  it("strips MS Office namespaced tags but keeps their text", () => {
    const out = sanitizeHtml('<p>before <o:p>inside</o:p> after</p>');
    expect(out).not.toMatch(/<o:p|<\/o:p/);
    expect(out).toContain("before");
    expect(out).toContain("inside");
    expect(out).toContain("after");
  });
});

describe("sanitizeHtml — link hardening", () => {
  it("adds target=_blank + rel=noopener noreferrer on external links", () => {
    const out = sanitizeHtml('<a href="https://example.com">click</a>');
    expect(out).toMatch(/target="_blank"/);
    expect(out).toMatch(/rel="noopener noreferrer"/);
  });

  it("does NOT add target/rel on internal (anchor / relative) links", () => {
    const out = sanitizeHtml('<a href="/articles/foo">internal</a>');
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
