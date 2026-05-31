import assert from "node:assert/strict";
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
  const ranges = findInlineAnnotationLivePreviewRanges(
    "[對象]^^(Gegenstand)^_(Object)：任何可以單獨被指稱、作為論元的東西"
  );

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].resetMarkdownEmphasisAfter, true);
}

{
  const ranges = findInlineAnnotationLivePreviewRanges("[term]^^(*gloss)");

  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].resetMarkdownEmphasisAfter, true);
}

console.log("Obsidian Live Preview range tests passed");
