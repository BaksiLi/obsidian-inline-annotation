import {
  findInlineAnnotationModels,
  type AnnotationOp,
  type AnnotationPosition,
  type InlineAnnotationModel,
  type InlineAnnotationOptions,
  type UnderlineStyle,
} from "markdown-it-inline-annotation/core";

interface ResolvedOptions {
  classPrefix: string;
  enableAbbreviated: boolean;
  spaceAlignment: "always" | "auto" | "off";
  fallbackParens: string;
}

type DecorationSlot =
  | { kind: "bouten"; position: AnnotationPosition }
  | { kind: "line"; position: AnnotationPosition; style: UnderlineStyle };

type ClassifiedSlot = DecorationSlot | { kind: "ruby"; raw: string };

interface ClassifiedEntry {
  slot: {
    position: AnnotationPosition;
  };
  value: ClassifiedSlot;
}

interface RubyEntry {
  slot: {
    position: AnnotationPosition;
  };
  value: { kind: "ruby"; raw: string };
}

const UNDERLINE_STYLES: Record<string, UnderlineStyle> = {
  ".-": "solid",
  ".~": "wavy",
  ".=": "double",
};

function resolveOptions(options?: InlineAnnotationOptions): ResolvedOptions {
  const resolved: ResolvedOptions = {
    classPrefix: options?.classPrefix ?? "ia",
    enableAbbreviated: options?.enableAbbreviated ?? true,
    spaceAlignment: options?.spaceAlignment ?? "always",
    fallbackParens: options?.fallbackParens ?? "()",
  };
  if (!options?.spaceAlignment && typeof options?.enableSpaceAlignment === "boolean") {
    resolved.spaceAlignment = options.enableSpaceAlignment ? "always" : "off";
  }
  return resolved;
}

function className(options: ResolvedOptions, suffix: string): string {
  return `${options.classPrefix}-${suffix}`;
}

function unescapeMarkup(input: string): string {
  return input.replace(/\\(.)/g, "$1");
}

function splitBySpaces(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function isPlainAsciiWord(text: string): boolean {
  return /^[A-Za-z][A-Za-z'-]*$/.test(text);
}

function shouldAlignBySpaces(plainBase: string, parts: string[], options: ResolvedOptions): boolean {
  if (options.spaceAlignment === "off") return false;
  const baseChars = Array.from(plainBase);
  if (parts.length !== baseChars.length) return false;
  if (options.spaceAlignment === "always") return true;
  return !parts.every(isPlainAsciiWord);
}

function shouldHideAnnotation(baseChar: string, annotation: string): boolean {
  return baseChar === annotation;
}

function positionForOp(op: AnnotationOp): AnnotationPosition {
  return op === "^^" ? "over" : "under";
}

function opposite(op: AnnotationOp): AnnotationOp {
  return op === "^^" ? "^_" : "^^";
}

function lineKeyword(position: AnnotationPosition): "overline" | "underline" {
  return position === "over" ? "overline" : "underline";
}

function lineClass(options: ResolvedOptions, position: AnnotationPosition, style: UnderlineStyle): string {
  const keyword = lineKeyword(position);
  const base = className(options, keyword);
  return style === "solid" ? base : `${base} ${className(options, `${keyword}-${style}`)}`;
}

function classifySlot(raw: string, position: AnnotationPosition): ClassifiedSlot {
  if (raw === "..") return { kind: "bouten", position };
  const style = UNDERLINE_STYLES[raw];
  if (style) return { kind: "line", position, style };
  return { kind: "ruby", raw };
}

function appendText(fragment: DocumentFragment, text: string): void {
  if (text) fragment.append(fragment.ownerDocument.createTextNode(unescapeMarkup(text)));
}

function appendFragment(target: DocumentFragment | Element, source: DocumentFragment): void {
  target.append(source);
}

function createFragment(document: Document): DocumentFragment {
  return document.createDocumentFragment();
}

function createTextFragment(document: Document, text: string): DocumentFragment {
  const fragment = createFragment(document);
  appendText(fragment, text);
  return fragment;
}

function createSpan(document: Document, classes: string, children: DocumentFragment): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = classes;
  appendFragment(span, children);
  return span;
}

function createRubyElement(
  document: Document,
  base: DocumentFragment,
  annotation: string,
  position: AnnotationPosition,
  options: ResolvedOptions,
  extraClasses = ""
): HTMLElement {
  const ruby = document.createElement("ruby");
  ruby.className = [className(options, "ruby"), className(options, `ruby-${position}`), extraClasses].filter(Boolean).join(" ");
  const open = options.fallbackParens.charAt(0) || "(";
  const close = options.fallbackParens.charAt(1) || ")";

  appendFragment(ruby, base);
  const rpOpen = document.createElement("rp");
  rpOpen.textContent = open;
  ruby.append(rpOpen);
  const rt = document.createElement("rt");
  rt.textContent = unescapeMarkup(annotation);
  ruby.append(rt);
  const rpClose = document.createElement("rp");
  rpClose.textContent = close;
  ruby.append(rpClose);
  return ruby;
}

function createRubyFragment(
  document: Document,
  base: DocumentFragment,
  annotation: string,
  position: AnnotationPosition,
  options: ResolvedOptions,
  extraClasses = ""
): DocumentFragment {
  const fragment = createFragment(document);
  fragment.append(createRubyElement(document, base, annotation, position, options, extraClasses));
  return fragment;
}

function hasInlineAnnotation(input: string, options: ResolvedOptions): boolean {
  return findInlineAnnotationModels(input, 0, input.length, options).length > 0;
}

function stripInlineAnnotationMarkup(input: string, options: ResolvedOptions): string {
  let plain = "";
  let pos = 0;
  for (const model of findInlineAnnotationModels(input, 0, input.length, options)) {
    if (model.start < pos) continue;
    plain += unescapeMarkup(input.slice(pos, model.start));
    plain += stripInlineAnnotationMarkup(model.base.raw, options);
    pos = model.end;
  }
  plain += unescapeMarkup(input.slice(pos));
  return plain;
}

function renderIndependentTextDecorations(
  document: Document,
  base: DocumentFragment,
  decos: DecorationSlot[],
  options: ResolvedOptions
): DocumentFragment {
  const ordered = [...decos].sort((a, b) => (a.position === b.position ? 0 : a.position === "over" ? -1 : 1));
  let current = base;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const deco = ordered[i];
    const classes =
      deco.kind === "bouten"
        ? [className(options, "bouten"), className(options, `bouten-${deco.position}`)].join(" ")
        : lineClass(options, deco.position, deco.style);
    const fragment = createFragment(document);
    fragment.append(createSpan(document, classes, current));
    current = fragment;
  }
  return current;
}

function renderDecorations(
  document: Document,
  base: DocumentFragment,
  decos: DecorationSlot[],
  options: ResolvedOptions
): DocumentFragment {
  const textDecorationDecos = decos.filter((deco) => deco.kind === "line" || deco.position === "under");
  const boutenOver = decos.find((deco) => deco.kind === "bouten" && deco.position === "over");

  if (textDecorationDecos.length > 1) {
    const decorated = renderIndependentTextDecorations(document, base, textDecorationDecos, options);
    if (!boutenOver) return decorated;
    const fragment = createFragment(document);
    fragment.append(createSpan(document, [className(options, "bouten"), className(options, "bouten-over")].join(" "), decorated));
    return fragment;
  }

  const classes: string[] = [];
  if (decos.some((deco) => deco.kind === "bouten")) classes.push(className(options, "bouten"));
  const ordered = [...decos].sort((a, b) => (a.position === b.position ? 0 : a.position === "over" ? -1 : 1));
  for (const deco of ordered) {
    if (deco.kind === "bouten") {
      classes.push(className(options, `bouten-${deco.position}`));
    } else {
      classes.push(...lineClass(options, deco.position, deco.style).split(" "));
    }
  }

  const fragment = createFragment(document);
  fragment.append(createSpan(document, classes.join(" "), base));
  return fragment;
}

function renderRubyWithDecoration(
  document: Document,
  base: DocumentFragment,
  rubyText: string,
  rubyPosition: AnnotationPosition,
  deco: DecorationSlot,
  options: ResolvedOptions
): DocumentFragment {
  const decoClass =
    deco.kind === "bouten"
      ? className(options, `bouten-${deco.position}`)
      : lineClass(options, deco.position, deco.style);
  return createRubyFragment(
    document,
    base,
    rubyText,
    rubyPosition,
    options,
    `${className(options, "ruby-mixed")} ${decoClass}`
  );
}

function renderRubyLevels(
  document: Document,
  baseRaw: string,
  plainBase: string,
  op: AnnotationOp,
  levels: string[],
  options: ResolvedOptions
): DocumentFragment {
  const baseChars = Array.from(plainBase);
  const innerPos = positionForOp(op);
  const outerPos = positionForOp(opposite(op));
  const doubleClass = className(options, "ruby-double");

  if (levels.length >= 2) {
    const raw1 = unescapeMarkup(levels[0]);
    const raw2 = unescapeMarkup(levels[1]);
    const ann1Parts = raw1.includes(" ") ? splitBySpaces(raw1) : null;
    const ann2Parts = raw2.includes(" ") ? splitBySpaces(raw2) : null;
    const can1Align = ann1Parts !== null && shouldAlignBySpaces(plainBase, ann1Parts, options);
    const can2Align = ann2Parts !== null && shouldAlignBySpaces(plainBase, ann2Parts, options);
    const fragment = createFragment(document);

    if (can1Align && can2Align) {
      for (const [index, char] of baseChars.entries()) {
        const ann1 = ann1Parts[index];
        const ann2 = ann2Parts[index];
        if (shouldHideAnnotation(char, ann1) && shouldHideAnnotation(char, ann2)) {
          appendFragment(fragment, createRubyFragment(document, createTextFragment(document, char), "", innerPos, options));
        } else if (shouldHideAnnotation(char, ann1)) {
          appendFragment(fragment, createRubyFragment(document, createTextFragment(document, char), ann2, outerPos, options));
        } else if (shouldHideAnnotation(char, ann2)) {
          appendFragment(fragment, createRubyFragment(document, createTextFragment(document, char), ann1, innerPos, options));
        } else {
          const inner = createRubyFragment(document, createTextFragment(document, char), ann1, innerPos, options);
          appendFragment(fragment, createRubyFragment(document, inner, ann2, outerPos, options, doubleClass));
        }
      }
      return fragment;
    }

    if (can1Align) {
      for (const [index, char] of baseChars.entries()) {
        const ann = ann1Parts[index];
        appendFragment(
          fragment,
          createRubyFragment(document, createTextFragment(document, char), shouldHideAnnotation(char, ann) ? "" : ann, innerPos, options)
        );
      }
      return createRubyFragment(document, fragment, levels[1], outerPos, options, doubleClass);
    }

    if (can2Align) {
      for (const [index, char] of baseChars.entries()) {
        const ann = ann2Parts[index];
        appendFragment(
          fragment,
          createRubyFragment(document, createTextFragment(document, char), shouldHideAnnotation(char, ann) ? "" : ann, outerPos, options)
        );
      }
      return createRubyFragment(document, fragment, levels[0], innerPos, options, doubleClass);
    }

    const inner = createRubyFragment(document, renderInlineAnnotationsToFragment(baseRaw, document, options), levels[0], innerPos, options);
    return createRubyFragment(document, inner, levels[1], outerPos, options, doubleClass);
  }

  if (levels.length === 1) {
    const raw = unescapeMarkup(levels[0]);
    if (raw.includes(" ")) {
      const parts = splitBySpaces(raw);
      if (shouldAlignBySpaces(plainBase, parts, options)) {
        const fragment = createFragment(document);
        for (const [index, char] of baseChars.entries()) {
          const ann = parts[index];
          appendFragment(
            fragment,
            createRubyFragment(document, createTextFragment(document, char), shouldHideAnnotation(char, ann) ? "" : ann, innerPos, options)
          );
        }
        return fragment;
      }
    }
    return createRubyFragment(document, renderInlineAnnotationsToFragment(baseRaw, document, options), levels[0], innerPos, options);
  }

  return renderInlineAnnotationsToFragment(baseRaw, document, options);
}

export function renderInlineAnnotationModelToFragment(
  model: InlineAnnotationModel,
  document: Document,
  rawOptions?: InlineAnnotationOptions
): DocumentFragment {
  const options = resolveOptions(rawOptions);
  const baseRaw = model.base.raw;
  const plainBase = hasInlineAnnotation(baseRaw, options) ? "" : stripInlineAnnotationMarkup(baseRaw, options);
  const classified: ClassifiedEntry[] = model.slots.map((slot) => ({ slot, value: classifySlot(slot.raw, slot.position) }));
  const decorations = classified
    .map(({ value }) => value)
    .filter((slot): slot is DecorationSlot => slot.kind !== "ruby");
  const rubies = classified.filter((entry): entry is RubyEntry => entry.value.kind === "ruby");

  let rendered: DocumentFragment;
  if (rubies.length === 0) {
    rendered = renderDecorations(document, renderInlineAnnotationsToFragment(baseRaw, document, options), decorations, options);
  } else if (rubies.length === 1 && decorations.length === 1) {
    rendered = renderRubyWithDecoration(
      document,
      renderInlineAnnotationsToFragment(baseRaw, document, options),
      rubies[0].value.raw,
      rubies[0].slot.position,
      decorations[0],
      options
    );
  } else {
    rendered = renderRubyLevels(
      document,
      baseRaw,
      plainBase,
      model.primaryOp,
      rubies.map((ruby) => ruby.value.raw),
      options
    );
  }

  for (const overflow of model.overflow) appendText(rendered, overflow.raw);
  return rendered;
}

export function renderInlineAnnotationsToFragment(
  input: string,
  document: Document,
  rawOptions?: InlineAnnotationOptions
): DocumentFragment {
  const options = resolveOptions(rawOptions);
  const fragment = createFragment(document);
  let pos = 0;

  for (const model of findInlineAnnotationModels(input, 0, input.length, options)) {
    if (model.start < pos) continue;
    appendText(fragment, input.slice(pos, model.start));
    appendFragment(fragment, renderInlineAnnotationModelToFragment(model, document, options));
    pos = model.end;
  }

  appendText(fragment, input.slice(pos));
  return fragment;
}
