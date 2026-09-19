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

const SCROLLING_CLASS = "code-space-is-scrolling";
const SCROLLBAR_HIDE_DELAY = 600;

/**
 * Shows a CodeMirror scroller's scrollbar while it is actively scrolling.
 * Focused scrollers remain visible through the CSS :focus-within selector.
 */
export function setupScrollbarVisibility(scroller: HTMLElement): () => void {
	const ownerWindow = scroller.ownerDocument.defaultView ?? window;
	let hideTimer: number | null = null;

	const onScroll = () => {
		scroller.classList.add(SCROLLING_CLASS);
		if (hideTimer !== null) {
			ownerWindow.clearTimeout(hideTimer);
		}
		hideTimer = ownerWindow.setTimeout(() => {
			hideTimer = null;
			scroller.classList.remove(SCROLLING_CLASS);
		}, SCROLLBAR_HIDE_DELAY);
	};

	scroller.addEventListener("scroll", onScroll, { passive: true });

	return () => {
		scroller.removeEventListener("scroll", onScroll);
		if (hideTimer !== null) {
			ownerWindow.clearTimeout(hideTimer);
			hideTimer = null;
		}
		scroller.classList.remove(SCROLLING_CLASS);
	};
}
