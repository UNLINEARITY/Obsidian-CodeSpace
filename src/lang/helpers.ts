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

const localeMap: { [key: string]: typeof en } = {
  'en': en,
  'zh-cn': zhCN,
};

const locale = window.moment.locale();

export function t(str: keyof typeof en): string {
  const lang = localeMap[locale] || en;

  return lang[str] || en[str];
}
