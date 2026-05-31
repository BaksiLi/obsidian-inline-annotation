import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  collectFallbackHostMarkdownRanges,
  mergeSourceRanges,
} from "../src/live-preview-host-syntax";
import { planInlineAnnotationLivePreviewDecorations } from "../src/live-preview-decoration-plan";
import { findInlineAnnotationLivePreviewRanges } from "../src/live-preview-ranges";

{
  const ranges = findInlineAnnotationLivePreviewRanges("a [漢字]^^(かんじ) b [base]^_(.-)");

  assert.equal(ranges.length, 2);
  assert.equal(ranges[0].from, 2);
  assert.equal(ranges[0].source, "[漢字]^^(かんじ)");
  assert.equal(ranges[0].model.base.raw, "漢字");
  assert.equal(ranges[0].model.slots[0].position, "over");
  assert.equal(ranges[0].resetMarkdownEmphasisAfter, false);
  assert.ok(ranges[0].html.includes("<rt>かんじ</rt>"));
  assert.equal(ranges[1].source, "[base]^_(.-)");
  assert.equal(ranges[1].resetMarkdownEmphasisAfter, true);
  assert.ok(ranges[1].html.includes("ia-underline"));
}

{
  const source = "a [漢字]^^(かんじ) b";
  const cursorInside = source.indexOf("漢");
  const ranges = findInlineAnnotationLivePreviewRanges(source, [{ from: cursorInside, to: cursorInside }]);

  assert.equal(ranges.length, 0);
}

{
  const ranges = findInlineAnnotationLivePreviewRanges("[a]^^(x|y|z)");

  assert.equal(ranges.length, 1);
  assert.deepEqual(ranges[0].model.overflow.map((range) => range.raw), ["|z"]);
  assert.ok(ranges[0].html.includes("|z"));
}

{
  const ranges = findInlineAnnotationLivePreviewRanges("[真值]^^(Truth Value) [取り返す]^^(と り かえ す)");

  assert.equal(ranges.length, 2);
  assert.equal(ranges[0].html.split("<rt>").length - 1, 1);
  assert.ok(ranges[0].html.includes("<rt>Truth Value</rt>"));
  assert.equal(ranges[1].html.split("<ruby").length - 1, 4);
}

{
  const ranges = findInlineAnnotationLivePreviewRanges("[漢字]^^(かんじ)", [{ from: 12, to: 12 }], undefined, 10);

  assert.equal(ranges.length, 0);
}

{
  const source = "[對象]^^(Gegenstand)^_(Object)：任何可以單獨被指稱、作為論元的東西";
  const ranges = findInlineAnnotationLivePreviewRanges(source);

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].resetMarkdownEmphasisAfter, true);
  assert.deepEqual(
    planInlineAnnotationLivePreviewDecorations(ranges, source.length).map((plan) => plan.type),
    ["replace", "reset-emphasis"]
  );
}

{
  const ranges = findInlineAnnotationLivePreviewRanges("[term]^^(*gloss)");

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].resetMarkdownEmphasisAfter, true);
}

{
  const ranges = findInlineAnnotationLivePreviewRanges(
    [
      "`[code]^^(ann)`",
      "[link [term]^^(ann)](https://example.com)",
      "![[image [term]^^(ann).png]]",
      "$[math]^^(ann)$",
      "<span title=\"[html]^^(ann)\">",
      "[text]^^(ann)",
    ].join(" ")
  );

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].source, "[text]^^(ann)");
}

{
  const ranges = findInlineAnnotationLivePreviewRanges(
    "skip [a]^^(x) keep [b]^^(y)",
    [],
    undefined,
    0,
    [{ from: 0, to: "skip [a]^^(x)".length }]
  );

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].source, "[b]^^(y)");
}

{
  assert.deepEqual(mergeSourceRanges([{ from: 6, to: 10 }, { from: 0, to: 4 }, { from: 3, to: 7 }]), [
    { from: 0, to: 10 },
  ]);
  assert.deepEqual(collectFallbackHostMarkdownRanges("`[code]^^(ann)` [text]^^(ann)"), [{ from: 0, to: 15 }]);
}

{
  const ranges = findInlineAnnotationLivePreviewRanges("[[護]^^(まも)れ]^_(プロテゴ)");

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].source, "[[護]^^(まも)れ]^_(プロテゴ)");
}

{
  const showcase = readFileSync("examples/obsidian-showcase.md", "utf8");
  const ranges = showcase.split(/\r?\n/).flatMap((line) => findInlineAnnotationLivePreviewRanges(line));
  const sources = ranges.map((range) => range.source);

  assert.ok(sources.includes("[對象]^^(Gegenstand)^_(Object)"));
  assert.ok(sources.includes("[取り返す]^^(と り かえ す)"));
  assert.ok(sources.includes("[[護]^^(まも)れ]^_(プロテゴ)"));
  assert.ok(sources.includes("[a]^^(x|y|z)"));
  assert.ok(!sources.includes("[term]^^(**bold gloss**)"));
  assert.ok(!sources.includes("[code]^^(ann)"));
  assert.ok(!sources.includes("[math]^^(ann)"));
  assert.ok(!sources.includes("[term]^^(ann)"));
}

console.log("Obsidian Live Preview range tests passed");
