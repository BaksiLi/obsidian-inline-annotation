import assert from "node:assert/strict";
import { findInlineAnnotationLivePreviewRanges } from "../src/live-preview-ranges";

{
  const ranges = findInlineAnnotationLivePreviewRanges("a [漢字]^^(かんじ) b [base]^_(.-)");

  assert.equal(ranges.length, 2);
  assert.equal(ranges[0].from, 2);
  assert.equal(ranges[0].source, "[漢字]^^(かんじ)");
  assert.ok(ranges[0].html.includes("<rt>かんじ</rt>"));
  assert.equal(ranges[1].source, "[base]^_(.-)");
  assert.ok(ranges[1].html.includes("ia-underline"));
}

{
  const source = "a [漢字]^^(かんじ) b";
  const cursorInside = source.indexOf("漢");
  const ranges = findInlineAnnotationLivePreviewRanges(source, [{ from: cursorInside, to: cursorInside }]);

  assert.equal(ranges.length, 0);
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

console.log("Obsidian Live Preview range tests passed");
