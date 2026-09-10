// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/app/icon.svg'), 'utf8');
const document = new DOMParser().parseFromString(source, 'image/svg+xml');
const svg = document.documentElement;

test('serves a square scalable site icon with an accessible brand name', () => {
  expect(svg.localName).toBe('svg');
  expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
  const [x, y, width, height] = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  expect([x, y]).toEqual([0, 0]);
  expect(width).toBeGreaterThan(0);
  expect(height).toBe(width);
  expect(svg.getAttribute('role')).toBe('img');
  const titleId = svg.getAttribute('aria-labelledby') ?? '';
  expect(document.getElementById(titleId)?.textContent).toMatch(/\bAster\b/);
});

test('the favicon renders without fonts, scripts, or external assets', () => {
  expect(document.querySelector('text, image, foreignObject, script, animate, animateTransform')).toBeNull();
  expect(document.querySelector('path, polygon, circle, rect')).not.toBeNull();
  for (const element of document.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      expect(attribute.name).not.toMatch(/^on/i);
      if (attribute.localName === 'href') expect(attribute.value).toMatch(/^#/);
    }
  }
  expect(source).not.toMatch(/@import|@font-face|url\(\s*['"]?(?!#)/i);
});
