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
import { TargetRegistry } from "../src/target_registry";

describe("target registry", () => {
	it("moves an item between target indexes without duplicates", () => {
		const registry = new TargetRegistry<object>();
		const item = {};

		registry.track(item, "a.ts");
		registry.track(item, "a.ts");
		expect(registry.get("a.ts")).toEqual([item]);

		registry.track(item, "b.ts");
		expect(registry.get("a.ts")).toEqual([]);
		expect(registry.get("b.ts")).toEqual([item]);
	});

	it("removes and clears tracked items", () => {
		const registry = new TargetRegistry<object>();
		const first = {};
		const second = {};
		registry.track(first, "a.ts");
		registry.track(second, "a.ts");

		registry.untrack(first);
		expect(registry.get("a.ts")).toEqual([second]);
		registry.clear();
		expect(registry.get("a.ts")).toEqual([]);

		registry.track(second, "a.ts");
		expect(registry.get("a.ts")).toEqual([second]);
	});
});
