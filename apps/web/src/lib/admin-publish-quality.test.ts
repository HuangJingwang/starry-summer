import { describe, expect, test } from 'vitest';

import { buildPublishQualityChecklist } from './admin-publish-quality';

describe('admin publish quality checklist', () => {
  test('warns before publishing when core reader-facing fields are thin', () => {
    const checks = buildPublishQualityChecklist({
      contentType: 'post',
      title: '短',
      summary: '',
      seoDescription: '太短',
      bodyWordCount: 120,
      coverAssetId: '',
    });

    expect(checks.map((check) => [check.label, check.status])).toEqual([
      ['标题', 'warning'],
      ['摘要', 'warning'],
      ['SEO 描述', 'warning'],
      ['正文体量', 'warning'],
      ['封面', 'warning'],
    ]);
  });

  test('marks publish checks as ready when metadata and writing depth are usable', () => {
    const checks = buildPublishQualityChecklist({
      contentType: 'post',
      title: '一次系统重构记录',
      summary: '这是一段给列表页、RSS 和分享卡片使用的摘要，说明文章主题、上下文和读者可以获得什么。',
      seoDescription: '这篇文章记录一次系统重构的背景、拆分过程、风险控制和复盘，方便未来回看架构决策。',
      bodyWordCount: 680,
      coverAssetId: 'asset-cover-1',
    });

    expect(checks.every((check) => check.status === 'ok')).toBe(true);
    expect(checks.find((check) => check.label === '正文体量')?.detail).toBe('正文 680 字，适合沉淀为长文。');
  });

  test('uses a lighter writing-depth threshold for moments', () => {
    const checks = buildPublishQualityChecklist({
      contentType: 'moment',
      title: '今日片段',
      summary: '今天记录一个小变化，方便以后翻回来看。',
      seoDescription: '今天记录一个小变化，方便以后翻回来看，也让归档和搜索更清楚。',
      bodyWordCount: 28,
      coverAssetId: '',
    });

    expect(checks.find((check) => check.label === '正文体量')?.status).toBe('ok');
  });
});
