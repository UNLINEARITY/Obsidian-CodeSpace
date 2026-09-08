"use strict";
/**
 * windowsConoutConnection.js — patched for Obsidian (Electron renderer).
 *
 * Adapted from node-pty 1.1.0 lib/windowsConoutConnection.js
 * (Copyright (c) Microsoft Corporation, MIT License) and the equivalent
 * patch in lean-obsidian-terminal
 * (Copyright (c) 2026 LeanProductivity - Sascha D. Kasper, MIT License).
 *
 * The upstream implementation drains the ConPTY conout socket on a worker
 * thread to avoid deadlocks when ClosePseudoConsole is called
 * (see microsoft/node-pty#375). Worker threads are not usable inside
 * Obsidian's Electron renderer process, so this patch performs the same
 * socket piping inline on the main thread, mirroring the behavior of
 * node-pty's lib/worker/conoutSocketWorker.js.
 *
 * Keep in sync with src/terminal/conout_patch.ts (enforced by
 * tests/terminal_conout_patch.test.ts).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConoutConnection = void 0;
var net = require("net");
var conout_1 = require("./shared/conout");
var eventEmitter2_1 = require("./eventEmitter2");
/**
 * The amount of time to wait for additional data after the conpty shell
 * process has exited before shutting down the server and sockets.
 */
var FLUSH_DATA_INTERVAL = 1000;
var ConoutConnection = /** @class */ (function () {
	function ConoutConnection(_conoutPipeName, _useConptyDll) {
		var _this = this;
		this._conoutPipeName = _conoutPipeName;
		this._useConptyDll = _useConptyDll;
		this._isDisposed = false;
		this._ready = false;
		this._onReady = new eventEmitter2_1.EventEmitter2();
		this._conoutSocket = new net.Socket();
		this._conoutSocket.setEncoding('utf8');
		this._conoutSocket.connect(_conoutPipeName, function () {
			_this._server = net.createServer(function (workerSocket) {
				_this._conoutSocket.pipe(workerSocket);
			});
			_this._server.listen(conout_1.getWorkerPipeName(_this._conoutPipeName));
			_this._ready = true;
			_this._onReady.fire();
		});
		// Ignore connection errors during cleanup.
		this._conoutSocket.on('error', function () { });
	}
	Object.defineProperty(ConoutConnection.prototype, "onReady", {
		get: function () { return this._onReady.event; },
		enumerable: false,
		configurable: true
	});
	ConoutConnection.prototype.dispose = function () {
		if (!this._useConptyDll && this._isDisposed) {
			return;
		}
		this._isDisposed = true;
		// Drain all data from the socket before closing
		this._drainDataAndClose();
	};
	ConoutConnection.prototype.connectSocket = function (socket) {
		socket.connect(conout_1.getWorkerPipeName(this._conoutPipeName));
	};
	ConoutConnection.prototype._drainDataAndClose = function () {
		var _this = this;
		if (this._drainTimeout) {
			clearTimeout(this._drainTimeout);
		}
		this._drainTimeout = setTimeout(function () { return _this._destroySocket(); }, FLUSH_DATA_INTERVAL);
	};
	ConoutConnection.prototype._destroySocket = function () {
		try {
			if (this._server) {
				this._server.close();
			}
		}
		catch (e) {
			// ignore close errors during cleanup
		}
		try {
			this._conoutSocket.destroy();
		}
		catch (e) {
			// ignore destroy errors during cleanup
		}
	};
	return ConoutConnection;
}());
exports.ConoutConnection = ConoutConnection;
