export interface InlineCommentAnchor {
  text: string;
  prefix: string;
  suffix: string;
  start: number;
  end: number;
  hash: string;
}

export interface AnchorRange {
  start: number;
  end: number;
  mapped: boolean;
}

export interface SplitAnchoredCommentsResult<T> {
  anchored: Array<T & { anchor: InlineCommentAnchor }>;
  regular: T[];
}

const contextLength = 80;

export function normalizeAnchorText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function createInlineCommentAnchor(articleText: string, start: number, end: number): InlineCommentAnchor {
  const safeStart = clamp(Math.min(start, end), 0, articleText.length);
  const safeEnd = clamp(Math.max(start, end), 0, articleText.length);
  const text = normalizeAnchorText(articleText.slice(safeStart, safeEnd));
  const prefix = normalizeAnchorText(articleText.slice(Math.max(0, safeStart - contextLength), safeStart));
  const suffix = normalizeAnchorText(articleText.slice(safeEnd, safeEnd + contextLength));

  return {
    text,
    prefix,
    suffix,
    start: safeStart,
    end: safeEnd,
    hash: hashAnchorParts(text, prefix, suffix),
  };
}

export function findAnchorRange(articleText: string, anchor: InlineCommentAnchor): AnchorRange {
  const exactText = articleText.slice(anchor.start, anchor.end);

  if (normalizeAnchorText(exactText) === anchor.text) {
    return {
      start: anchor.start,
      end: anchor.end,
      mapped: true,
    };
  }

  const contextMatch = findContextualMatch(articleText, anchor);

  if (contextMatch) {
    return contextMatch;
  }

  const textIndex = articleText.indexOf(anchor.text);

  if (textIndex >= 0) {
    return {
      start: textIndex,
      end: textIndex + anchor.text.length,
      mapped: true,
    };
  }

  return {
    start: -1,
    end: -1,
    mapped: false,
  };
}

export function hasCommentAnchor<T extends object>(
  comment: T,
): comment is T & { anchor: InlineCommentAnchor } {
  const candidate = comment as { anchor?: InlineCommentAnchor | null };

  return Boolean(candidate.anchor?.text && candidate.anchor.hash);
}

export function splitAnchoredComments<T extends object>(
  comments: T[],
): SplitAnchoredCommentsResult<T> {
  const anchored: Array<T & { anchor: InlineCommentAnchor }> = [];
  const regular: T[] = [];

  for (const comment of comments) {
    if (hasCommentAnchor(comment)) {
      anchored.push(comment);
    } else {
      regular.push(comment);
    }
  }

  return { anchored, regular };
}

function findContextualMatch(articleText: string, anchor: InlineCommentAnchor): AnchorRange | null {
  let searchFrom = 0;

  while (searchFrom < articleText.length) {
    const start = articleText.indexOf(anchor.text, searchFrom);

    if (start < 0) {
      return null;
    }

    const end = start + anchor.text.length;
    const before = normalizeAnchorText(articleText.slice(Math.max(0, start - contextLength), start));
    const after = normalizeAnchorText(articleText.slice(end, end + contextLength));
    const prefixMatches = !anchor.prefix || before.endsWith(anchor.prefix);
    const suffixMatches = !anchor.suffix || after.startsWith(anchor.suffix);

    if (prefixMatches && suffixMatches) {
      return { start, end, mapped: true };
    }

    searchFrom = end;
  }

  return null;
}

function hashAnchorParts(text: string, prefix: string, suffix: string): string {
  const input = `${prefix}\n${text}\n${suffix}`;
  let hashA = 0x811c9dc5;
  let hashB = 0x85ebca6b;

  for (let index = 0; index < input.length; index += 1) {
    const char = input.charCodeAt(index);
    hashA = Math.imul(hashA ^ char, 0x01000193) >>> 0;
    hashB = Math.imul(hashB ^ char, 0x27d4eb2d) >>> 0;
  }

  const base = `${hashA.toString(16).padStart(8, '0')}${hashB.toString(16).padStart(8, '0')}`;

  return base.repeat(4).slice(0, 64);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
