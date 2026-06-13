import type { ContentType } from '@starry-summer/shared';

export interface PublishQualityChecklistInput {
  contentType: ContentType;
  title: string;
  summary: string;
  seoDescription: string;
  bodyWordCount: number;
  coverAssetId: string;
}

export interface PublishQualityCheck {
  label: string;
  status: 'ok' | 'warning';
  detail: string;
}

export function buildPublishQualityChecklist(input: PublishQualityChecklistInput): PublishQualityCheck[] {
  const titleLength = input.title.trim().length;
  const summaryLength = input.summary.trim().length;
  const seoDescriptionLength = input.seoDescription.trim().length;
  const bodyMinimum = input.contentType === 'moment' ? 20 : 300;

  return [
    {
      label: '标题',
      status: titleLength >= 6 ? 'ok' : 'warning',
      detail: titleLength >= 6 ? '标题可读性良好。' : '建议写清主题，避免发布后列表页难以识别。',
    },
    {
      label: '摘要',
      status: summaryLength >= 20 && summaryLength <= 180 ? 'ok' : 'warning',
      detail:
        summaryLength === 0
          ? '建议补一段摘要，用于列表页、RSS 和分享卡片。'
          : summaryLength > 180
            ? '摘要偏长，建议压到 180 字以内。'
            : '摘要略短，建议补足上下文。',
    },
    {
      label: 'SEO 描述',
      status: seoDescriptionLength >= 30 && seoDescriptionLength <= 180 ? 'ok' : 'warning',
      detail:
        seoDescriptionLength === 0
          ? '建议补 SEO 描述，让搜索和分享预览更清楚。'
          : seoDescriptionLength > 180
            ? 'SEO 描述偏长，建议压到 180 字以内。'
            : 'SEO 描述略短，建议说明主题和价值。',
    },
    {
      label: '正文体量',
      status: input.bodyWordCount >= bodyMinimum ? 'ok' : 'warning',
      detail:
        input.bodyWordCount >= bodyMinimum
          ? input.contentType === 'moment'
            ? `正文 ${input.bodyWordCount} 字，适合发布为日常。`
            : `正文 ${input.bodyWordCount} 字，适合沉淀为长文。`
          : input.contentType === 'moment'
            ? `当前 ${input.bodyWordCount} 字，日常至少建议 ${bodyMinimum} 字。`
            : `当前 ${input.bodyWordCount} 字，长文至少建议 ${bodyMinimum} 字。`,
    },
    {
      label: '封面',
      status: input.coverAssetId.trim() ? 'ok' : 'warning',
      detail: input.coverAssetId.trim() ? '已设置封面素材。' : '建议选择封面，列表页和分享时更容易识别。',
    },
  ];
}
