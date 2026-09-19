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
import { calculateVirtualGridWindow } from "../src/dashboard_virtual_grid";

describe("calculateVirtualGridWindow", () => {
	it("keeps rendered indexes bounded for ten thousand items", () => {
		const result = calculateVirtualGridWindow({
			itemCount: 10_000,
			containerWidth: 1400,
			scrollTop: 50_000,
			viewportHeight: 900,
			minCardWidth: 320,
			rowHeight: 88,
			gap: 14,
			overscanRows: 4,
		});

		expect(result.columns).toBe(4);
		expect(result.endIndex - result.startIndex).toBeLessThan(100);
		expect(result.totalRows).toBe(2500);
	});

	it("handles empty and narrow single-column layouts", () => {
		const input = {
			itemCount: 0,
			containerWidth: 300,
			scrollTop: 0,
			viewportHeight: 600,
			minCardWidth: 320,
			rowHeight: 88,
			gap: 14,
			overscanRows: 4,
		};
		const empty = calculateVirtualGridWindow(input);
		expect(empty).toMatchObject({ columns: 1, totalRows: 0, startIndex: 0, endIndex: 0, totalHeight: 0 });

		const narrow = calculateVirtualGridWindow({ ...input, itemCount: 100 });
		expect(narrow.columns).toBe(1);
		expect(narrow.endIndex).toBeLessThan(20);
	});
});
