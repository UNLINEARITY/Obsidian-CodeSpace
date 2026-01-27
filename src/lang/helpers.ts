import en from './locale/en';
import zhCN from './locale/zh-cn';

const localeMap: { [key: string]: typeof en } = {
  'en': en,
  'zh-cn': zhCN,
};

const locale = window.moment.locale();

export function t(str: keyof typeof en): string {
  const lang = localeMap[locale] || en;

  return lang[str] || en[str];
}
