import { moment } from 'obsidian';
import en from './locale/en';
import zhCN from './locale/zh-cn';

const localeMap: { [key: string]: typeof en } = {
  'en': en,
  'zh-cn': zhCN,
};

const locale = window.moment.locale();

export function t(str: keyof typeof en): string {
  // 如果是中文环境，使用 zhCN，否则默认 en
  
  const lang = (locale === 'zh-cn') ? zhCN : en;

  return lang[str] || en[str];
}
