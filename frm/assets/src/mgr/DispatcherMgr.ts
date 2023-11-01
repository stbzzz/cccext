import { EventTarget } from "cc";
import { Singleton } from "./Singleton";

class DispatcherMgr extends Singleton {

    public get gui(): EventTarget { return this._guiEventTarget; }

    protected onCreate(): void {
        this._guiEventTarget = new EventTarget();
    }

    //private
    private _guiEventTarget: EventTarget = null!;
}

export const Dispatcher = DispatcherMgr.getInstance() as DispatcherMgr;