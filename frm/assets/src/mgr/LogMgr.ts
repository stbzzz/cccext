import { frm } from "../Defines";

export class LogMgr {
    public install(mode: frm.Mode) {
        if (mode != frm.Mode.Release) {
            this.i = console.log.bind(console);
            this.w = console.warn.bind(console);
            this.e = console.error.bind(console);
        }
    }

    public i = function (...args: any[]) { };
    public w = function (...args: any[]) { };
    public e = function (...args: any[]) { };
}