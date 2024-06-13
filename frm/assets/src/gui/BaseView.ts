
import { BaseWidget } from "./Foundation";
import { Closeable } from "./comp/Closeable";

export class BaseView extends BaseWidget {
    public setSuffix(suffix: string) {
        this.getComponent(Closeable)?.init(suffix);
        this.getComponent(Closeable)?.setClickCloseCb(this._onClickedClose.bind(this));
    }

    protected _closeView(showType?: number, hideType?: number) {
        this.getComponent(Closeable)?.closeView(showType, hideType);
    }

    /**
     * 当调用 onClickClose 时会回调此方法
     */
    protected _onClickedClose() { }
}