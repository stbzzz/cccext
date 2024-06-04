import { frm } from "../Defines";
import { Singleton } from "./Singleton";

class LogMgr extends Singleton {
    public init(mode: frm.Mode) {
        this._mode = mode;
    }

    public i = console.log.bind(console);
    public w = console.warn.bind(console);
    public e = console.error.bind(console);

    private i_(...args: any[]) {
        if (this._mode == frm.Mode.Release) return;
        const originalConsoleLog = console.log;
        const error = new Error();
        const stackLines = error.stack?.split('\n');
        const callerLine = stackLines ? stackLines[2] : '';
        const match = callerLine.match(/at (.+)/);
        const location = match ? match[1] : 'unknown location';
        originalConsoleLog.apply(console, [`[${location}]`, ...args]);
    }

    private w_(...args: any[]) {
        if (this._mode == frm.Mode.Release) return;
        const originalConsoleLog = console.warn;
        const error = new Error();
        const stackLines = error.stack?.split('\n');
        const callerLine = stackLines ? stackLines[2] : '';
        const match = callerLine.match(/at (.+)/);
        const location = match ? match[1] : 'unknown location';
        originalConsoleLog.apply(console, [`[${location}]`, ...args]);
    }

    private e_(...args: any[]) {
        if (this._mode == frm.Mode.Release) return;
        const originalConsoleLog = console.error;
        const error = new Error();
        const stackLines = error.stack?.split('\n');
        const callerLine = stackLines ? stackLines[2] : '';
        const match = callerLine.match(/at (.+)/);
        const location = match ? match[1] : 'unknown location';
        originalConsoleLog.apply(console, [`[${location}]`, ...args]);
    }

    private _mode: frm.Mode = frm.Mode.Dev;
}

export const L = LogMgr.getInstance() as LogMgr;