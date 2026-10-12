// SPDX-License-Identifier: AGPL-3.0-or-later
// Code Space - professional code file support for Obsidian.
// Copyright (C) 2026 unlinearity
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import en from './locale/en';
import zhCN from './locale/zh-cn';
import ja from './locale/ja';
import ko from './locale/ko';
import de from './locale/de';
import es from './locale/es';
import ptBR from './locale/pt-br';

const localeMap: { [key: string]: typeof en } = {
  'en': en,
  'zh-cn': zhCN,
  'ja': ja,
  'ko': ko,
  'de': de,
  'es': es,
  'pt-br': ptBR,
  // 葡萄牙葡语回落到巴西葡语（当前唯一葡语翻译）
  'pt': ptBR,
};

// 归一化匹配：先整体匹配（zh-cn、pt-br），再按主子标签匹配（ja-jp → ja、de-at → de、es-mx → es、ko-kr → ko）
const rawLocale = (window.moment.locale() || 'en').toLowerCase();
const primaryLocale = rawLocale.split('-')[0] ?? '';
const lang = localeMap[rawLocale] ?? localeMap[primaryLocale] ?? en;

export function t(str: keyof typeof en): string {
  return lang[str] || en[str];
}
