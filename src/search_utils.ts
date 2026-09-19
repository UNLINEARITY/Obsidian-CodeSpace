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

import type { Text } from "@codemirror/state";
import type { SearchQuery } from "@codemirror/search";

export interface SearchMatch {
	from: number;
	to: number;
}

export function findNextSearchMatch(query: SearchQuery, doc: Text, from: number): SearchMatch | null {
	if (!query.valid || !query.search) return null;

	const start = Math.max(0, Math.min(from, doc.length));
	const next = query.getCursor(doc, start).next();
	if (!next.done) return { from: next.value.from, to: next.value.to };

	const wrapped = query.getCursor(doc, 0, start).next();
	return wrapped.done ? null : { from: wrapped.value.from, to: wrapped.value.to };
}

export function findPreviousSearchMatch(query: SearchQuery, doc: Text, before: number): SearchMatch | null {
	if (!query.valid || !query.search) return null;

	const end = Math.max(0, Math.min(before, doc.length));
	let previous: SearchMatch | null = null;
	const cursor = query.getCursor(doc, 0, end);
	for (let result = cursor.next(); !result.done; result = cursor.next()) {
		previous = { from: result.value.from, to: result.value.to };
	}
	if (previous) return previous;

	const wrapped = query.getCursor(doc, end);
	for (let result = wrapped.next(); !result.done; result = wrapped.next()) {
		previous = { from: result.value.from, to: result.value.to };
	}
	return previous;
}

export function collectSearchMatches(query: SearchQuery, doc: Text): SearchMatch[] {
	if (!query.valid || !query.search) return [];

	const matches: SearchMatch[] = [];
	const cursor = query.getCursor(doc);
	for (let result = cursor.next(); !result.done; result = cursor.next()) {
		matches.push({ from: result.value.from, to: result.value.to });
	}
	return matches;
}

export function selectionMatchesQuery(
	query: SearchQuery,
	doc: Text,
	from: number,
	to: number,
): boolean {
	if (!query.valid || !query.search) return false;

	const cursor = query.getCursor(doc);
	for (let result = cursor.next(); !result.done; result = cursor.next()) {
		if (result.value.from === from && result.value.to === to) return true;
		if (result.value.from > from) return false;
	}
	return false;
}
