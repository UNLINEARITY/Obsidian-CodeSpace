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

import { describe, expect, it } from "vitest";
import en from "../src/lang/locale/en";
import zhCN from "../src/lang/locale/zh-cn";
import ja from "../src/lang/locale/ja";
import ko from "../src/lang/locale/ko";
import de from "../src/lang/locale/de";
import es from "../src/lang/locale/es";
import ptBR from "../src/lang/locale/pt-br";

const locales: Record<string, typeof en> = {
	"en": en,
	"zh-cn": zhCN,
	"ja": ja,
	"ko": ko,
	"de": de,
	"es": es,
	"pt-br": ptBR,
};

// 提取占位符并排序为可比较序列，如 "Showing {0} of {1}" → "{0},{1}"
function placeholderSignature(value: string): string {
	return (value.match(/\{\d\}/g) ?? []).sort().join(",");
}

describe("locale parity", () => {
	it("every locale exposes exactly the same keys as en", () => {
		const enKeys = Object.keys(en).sort().join(",");
		for (const [name, dict] of Object.entries(locales)) {
			expect(Object.keys(dict).sort().join(","), `locale ${name}`).toBe(enKeys);
		}
	});

	it("placeholder sequences match en for every key", () => {
		for (const [name, dict] of Object.entries(locales)) {
			for (const key of Object.keys(en) as (keyof typeof en)[]) {
				expect(placeholderSignature(dict[key] ?? ""), `locale ${name} key ${key}`).toBe(
					placeholderSignature(en[key])
				);
			}
		}
	});
});
