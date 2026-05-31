import assert from "node:assert/strict";
import { Window } from "happy-dom";
import fixtureCorpus from "markdown-it-inline-annotation/fixtures/html-render.json";
import { renderInlineAnnotationsInElement } from "../src/postprocessor";

interface FixtureCorpus {
  cases: Array<{
    id: string;
    assertionType?: "semantic" | "rendering-policy" | "host-skip";
    input: string;
    options?: { spaceAlignment?: string };
    contains?: string[];
    notContains?: string[];
    counts?: Array<{ pattern: string; count: number }>;
  }>;
}

const OBSIDIAN_LEGACY_SKIPPED_SHARED_FIXTURES = new Set([
  // markdown-it-inline-annotation@0.3.0 couples this capacity assertion to
  // always-on space alignment. The canonical fixture has been narrowed after
  // 0.3.0 so future published corpora can run it as semantic.
  "ruby-pipe-saturated-passes-through",
]);

function shouldSkipSharedFixture(fixture: FixtureCorpus["cases"][number]): boolean {
  if (fixture.assertionType === "host-skip") return true;
  if (fixture.assertionType === "rendering-policy" && fixture.options?.spaceAlignment === "always") return true;
  return OBSIDIAN_LEGACY_SKIPPED_SHARED_FIXTURES.has(fixture.id);
}

function createRoot(html = ""): HTMLElement {
  const window = new Window();
  const root = window.document.createElement("div");
  root.innerHTML = html;
  window.document.body.append(root);
  return root;
}

function createTextRoot(input: string): HTMLElement {
  const root = createRoot("<p></p>");
  const paragraph = root.querySelector("p");
  assert.ok(paragraph);
  paragraph.textContent = input;
  return root;
}

function assertContains(html: string, parts: string[] = []): void {
  for (const part of parts) {
    const domSerializedPart = part.replace(/&quot;/g, "\"");
    assert.ok(html.includes(part) || html.includes(domSerializedPart), `Missing ${part} in ${html}`);
  }
}

function assertNotContains(html: string, parts: string[] = []): void {
  for (const part of parts) assert.ok(!html.includes(part), `Unexpected ${part} in ${html}`);
}

let sharedFixturesRun = 0;
let sharedFixturesSkipped = 0;
for (const fixture of (fixtureCorpus as FixtureCorpus).cases) {
  if (shouldSkipSharedFixture(fixture)) {
    sharedFixturesSkipped++;
    continue;
  }
  sharedFixturesRun++;
  const root = createTextRoot(fixture.input);
  renderInlineAnnotationsInElement(root);
  const html = root.innerHTML;
  assertContains(html, fixture.contains);
  assertNotContains(html, fixture.notContains);
  for (const count of fixture.counts ?? []) {
    assert.equal(
      html.split(count.pattern).length - 1,
      count.count,
      `${fixture.id} expected ${count.pattern} count ${count.count} in ${html}`
    );
  }
}

{
  const root = createTextRoot("[真值]^^(Truth Value)");
  renderInlineAnnotationsInElement(root);
  const html = root.innerHTML;

  assert.ok(html.includes("<rt>Truth Value</rt>"));
  assert.equal(html.split("<rt>").length - 1, 1);
}

{
  const root = createTextRoot("[取り返す]^^(と り かえ す)");
  renderInlineAnnotationsInElement(root);
  const html = root.innerHTML;

  assert.ok(html.includes("<rt>と</rt>"));
  assert.ok(html.includes("り<rp>(</rp><rt></rt>"));
  assert.ok(html.includes("<rt>かえ</rt>"));
  assert.ok(html.includes("す<rp>(</rp><rt></rt>"));
  assert.equal(html.split("<ruby").length - 1, 4);
}

{
  const root = createRoot("<p><code></code> <a href=\"https://example.com\"></a> <span></span></p>");
  root.querySelector("code")!.textContent = "[code]^^(ann)";
  root.querySelector("a")!.textContent = "[link]^^(ann)";
  root.querySelector("span")!.textContent = "[text]^^(ann)";

  const stats = renderInlineAnnotationsInElement(root);
  const html = root.innerHTML;

  assert.equal(stats.replacements, 1);
  assert.ok(html.includes("<code>[code]^^(ann)</code>"));
  assert.ok(html.includes('<a href="https://example.com">[link]^^(ann)</a>'));
  assert.ok(html.includes("<rt>ann</rt>"));
}

{
  const root = createRoot("<pre></pre><ruby></ruby><script></script><style></style><textarea></textarea>");
  root.querySelector("pre")!.textContent = "[pre]^^(ann)";
  root.querySelector("ruby")!.textContent = "[ruby]^^(ann)";
  root.querySelector("script")!.textContent = "[script]^^(ann)";
  root.querySelector("style")!.textContent = "[style]^^(ann)";
  root.querySelector("textarea")!.textContent = "[textarea]^^(ann)";

  const stats = renderInlineAnnotationsInElement(root);

  assert.equal(stats.replacements, 0);
  assert.ok(!root.innerHTML.includes("<rt>ann</rt>"));
}

{
  const root = createRoot("<p data-inline-annotation-ignore></p><p></p>");
  root.querySelectorAll("p")[0].textContent = "[ignored]^^(ann)";
  root.querySelectorAll("p")[1].textContent = "[rendered]^^(ann)";

  const stats = renderInlineAnnotationsInElement(root);
  const html = root.innerHTML;

  assert.equal(stats.replacements, 1);
  assert.ok(html.includes("[ignored]^^(ann)"));
  assert.ok(html.includes("<rt>ann</rt>"));
}

{
  const root = createTextRoot("[漢字]^^(かんじ)");

  assert.equal(renderInlineAnnotationsInElement(root).replacements, 1);
  assert.equal(renderInlineAnnotationsInElement(root).replacements, 0);
  assert.equal(root.innerHTML.split("<ruby").length - 1, 1);
}

{
  const root = createRoot("<p><span></span><strong>bold gloss</strong><span>)</span></p>");
  root.querySelector("span")!.textContent = "[term]^^(";

  const stats = renderInlineAnnotationsInElement(root);

  assert.equal(stats.replacements, 0);
  assert.ok(root.innerHTML.includes("[term]^^("));
  assert.ok(root.innerHTML.includes("<strong>bold gloss</strong>"));
}

console.log(
  `Obsidian DOM postprocessor: ${sharedFixturesRun} shared fixtures passed, ${sharedFixturesSkipped} shared fixtures skipped`
);
