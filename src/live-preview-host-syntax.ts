export interface SourceRange {
  from: number;
  to: number;
}

export function mergeSourceRanges(ranges: readonly SourceRange[]): SourceRange[] {
  const sorted = ranges
    .filter((range) => range.to > range.from)
    .sort((left, right) => left.from - right.from || left.to - right.to);
  const merged: SourceRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.from <= previous.to) {
      previous.to = Math.max(previous.to, range.to);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

function countRun(text: string, index: number, char: string): number {
  let count = 0;
  while (text[index + count] === char) count++;
  return count;
}

function isEscaped(text: string, index: number): boolean {
  let backslashes = 0;
  for (let pos = index - 1; pos >= 0 && text[pos] === "\\"; pos--) backslashes++;
  return backslashes % 2 === 1;
}

function findClosingBracket(text: string, open: number): number {
  let depth = 0;
  for (let pos = open + 1; pos < text.length; pos++) {
    if (isEscaped(text, pos)) continue;
    if (text[pos] === "[") depth++;
    if (text[pos] === "]") {
      if (depth === 0) return pos;
      depth--;
    }
  }
  return -1;
}

function findClosingParen(text: string, open: number): number {
  let depth = 0;
  for (let pos = open + 1; pos < text.length; pos++) {
    if (isEscaped(text, pos)) continue;
    if (text[pos] === "(") depth++;
    if (text[pos] === ")") {
      if (depth === 0) return pos;
      depth--;
    }
  }
  return -1;
}

function findClosingDelimiter(text: string, open: number, delimiter: string): number {
  for (let pos = open + delimiter.length; pos < text.length; pos++) {
    if (isEscaped(text, pos)) continue;
    if (text.startsWith(delimiter, pos)) return pos + delimiter.length;
  }
  return -1;
}

export function collectFallbackHostMarkdownRanges(text: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  let pos = 0;

  while (pos < text.length) {
    if (text[pos] === "`") {
      const tickCount = countRun(text, pos, "`");
      const delimiter = "`".repeat(tickCount);
      const end = findClosingDelimiter(text, pos, delimiter);
      if (end > pos) {
        ranges.push({ from: pos, to: end });
        pos = end;
        continue;
      }
    }

    if (text[pos] === "$" && !isEscaped(text, pos)) {
      const delimiter = text[pos + 1] === "$" ? "$$" : "$";
      const end = findClosingDelimiter(text, pos, delimiter);
      if (end > pos) {
        ranges.push({ from: pos, to: end });
        pos = end;
        continue;
      }
    }

    if (text.startsWith("[[", pos) && !isEscaped(text, pos)) {
      const end = text.indexOf("]]", pos + 2);
      if (end !== -1) {
        ranges.push({ from: pos, to: end + 2 });
        pos = end + 2;
        continue;
      }
    }

    if (text[pos] === "<" && !isEscaped(text, pos)) {
      const end = text.indexOf(">", pos + 1);
      if (end !== -1) {
        const tag = text.slice(pos, end + 1);
        if (/^<\/?[A-Za-z][^>]*>$/.test(tag)) {
          ranges.push({ from: pos, to: end + 1 });
          pos = end + 1;
          continue;
        }
      }
    }

    const linkStart = text[pos] === "!" && text[pos + 1] === "[" ? pos + 1 : text[pos] === "[" ? pos : -1;
    if (linkStart !== -1 && !isEscaped(text, linkStart)) {
      const labelEnd = findClosingBracket(text, linkStart);
      if (labelEnd !== -1) {
        if (text[labelEnd + 1] === "(") {
          const linkEnd = findClosingParen(text, labelEnd + 1);
          if (linkEnd !== -1) {
            ranges.push({ from: pos, to: linkEnd + 1 });
            pos = linkEnd + 1;
            continue;
          }
        } else if (text[labelEnd + 1] === "[") {
          const referenceEnd = findClosingBracket(text, labelEnd + 1);
          if (referenceEnd !== -1) {
            ranges.push({ from: pos, to: referenceEnd + 1 });
            pos = referenceEnd + 1;
            continue;
          }
        }
      }
    }

    pos++;
  }

  return mergeSourceRanges(ranges);
}
