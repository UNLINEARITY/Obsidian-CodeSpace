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

export class TargetRegistry<T extends object> {
	private targetByItem = new WeakMap<T, string>();
	private itemsByTarget = new Map<string, Set<T>>();

	track(item: T, target: string): void {
		const previousTarget = this.targetByItem.get(item);
		if (previousTarget === target) return;
		if (previousTarget) {
			this.removeFromTarget(item, previousTarget);
		}

		this.targetByItem.set(item, target);
		let items = this.itemsByTarget.get(target);
		if (!items) {
			items = new Set<T>();
			this.itemsByTarget.set(target, items);
		}
		items.add(item);
	}

	untrack(item: T): void {
		const target = this.targetByItem.get(item);
		if (!target) return;
		this.removeFromTarget(item, target);
		this.targetByItem.delete(item);
	}

	get(target: string): T[] {
		return Array.from(this.itemsByTarget.get(target) ?? []);
	}

	clear(): void {
		this.itemsByTarget.clear();
		this.targetByItem = new WeakMap<T, string>();
	}

	private removeFromTarget(item: T, target: string): void {
		const items = this.itemsByTarget.get(target);
		items?.delete(item);
		if (items?.size === 0) {
			this.itemsByTarget.delete(target);
		}
	}
}
