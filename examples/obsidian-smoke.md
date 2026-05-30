# Inline Annotation Smoke

Use Reading view for this file. Live Preview and Source mode intentionally show
the original source.

## Core

漢字^^(かんじ) renders ruby above.

cat^_(/kæt/) renders ruby below.

北京^^(Beijing|PKG) renders two annotation slots.

[base]^^(over)^_(under) renders chained over/under annotations.

## Study Notes

Frege 把「函數」描述為某種 [不飽和實體]^^(unsaturated entity)：它本身帶有「空位」，需要論元來「補足」才能產生一個完整的值。

[對象]^^(Gegenstand)^_(Object)：任何可以單獨被指稱、作為論元的東西，包括普通個體、數、以及兩個特別的 [真值]^^(Truth Value) The True / The False。

重要語句^^(じゅうようごく|.-) can combine ruby and underline.

## Alignment

[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)

[振り仮名]^^(ふ り が な)

[[護]^^(まも)れ]^_(プロテゴ)

## Known V1 Limits

Markdown inside annotation text is not supported in Obsidian Reading view v1:

`[term]^^(**bold gloss**)`

[term]^^(**bold gloss**)

Markdown inside the abbreviated base is also not supported in Obsidian Reading
view v1:

`**H**₂O^^(**Hydrogen** Dioxide)`

**H**₂O^^(**Hydrogen** Dioxide)
