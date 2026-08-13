import type {
  ExportFormat,
  ExportFraming,
  ExportSize,
  InputFormat,
  Locale,
} from '@/types/app';

export const FEEDBACK_REPOSITORY_URL = 'https://github.com/Achilles-one/3dphoto';
export const FEEDBACK_ISSUE_URL = `${FEEDBACK_REPOSITORY_URL}/issues/new`;

export interface FeedbackContext {
  version: string;
  buildId: string;
  locale: Locale;
  browser: string;
  inputFormat: InputFormat | 'not-loaded' | 'unknown';
  exportFormat: ExportFormat | 'not-applicable';
  exportSize: ExportSize | 'not-applicable';
  exportFraming: ExportFraming | 'not-applicable';
  errorCode: string;
}

export function getBrowserLabel(userAgent: string): string {
  const candidates: Array<[RegExp, string]> = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari\//, 'Safari'],
  ];

  for (const [pattern, name] of candidates) {
    const match = userAgent.match(pattern);
    if (match?.[1]) {
      return `${name} ${match[1]}`;
    }
  }

  return 'Other browser';
}

export function createFeedbackUrl(context: FeedbackContext): string {
  const copy = context.locale === 'zh-CN'
    ? {
        title: '反馈',
        heading: '反馈',
        hint: '<!-- 请说明发生了什么，以及您的预期。除非您主动选择分享，否则请勿附上私密照片。 -->',
        diagnostics: '安全诊断信息',
        version: '版本',
        build: '构建号',
        browser: '浏览器',
        input: '输入格式',
        format: '导出格式',
        size: '导出尺寸',
        framing: 'GIF 导出取景',
        error: '错误码',
        privacy: '_以下信息在本地生成，不包含图片内容或文件名。_',
      }
    : {
        title: 'Feedback',
        heading: 'Feedback',
        hint: '<!-- Tell us what happened and what you expected. Do not attach a private photo unless you choose to share it. -->',
        diagnostics: 'Safe diagnostics',
        version: 'Version',
        build: 'Build',
        browser: 'Browser',
        input: 'Input format',
        format: 'Export format',
        size: 'Export size',
        framing: 'Export framing',
        error: 'Error code',
        privacy: '_Generated locally. No image content or file name is included._',
      };
  const url = new URL(FEEDBACK_ISSUE_URL);
  url.searchParams.set(
    'title',
    `[${copy.title}] 3D Photo Enhancer Beta v${context.version}`,
  );
  url.searchParams.set(
    'body',
    [
      `## ${copy.heading}`,
      '',
      copy.hint,
      '',
      `## ${copy.diagnostics}`,
      '',
      `- ${copy.version}: Beta v${context.version}`,
      `- ${copy.build}: ${context.buildId}`,
      `- ${copy.browser}: ${context.browser}`,
      `- ${copy.input}: ${context.inputFormat}`,
      `- ${copy.format}: ${context.exportFormat}`,
      `- ${copy.size}: ${context.exportSize}`,
      `- ${copy.framing}: ${context.exportFraming}`,
      `- ${copy.error}: ${context.errorCode}`,
      '',
      copy.privacy,
    ].join('\n'),
  );
  return url.toString();
}
