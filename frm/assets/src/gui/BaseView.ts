
import { BaseWidget } from "./Foundation";
import { Closeable } from "./comp/Closeable";

export class BaseView extends BaseWidget {
    public setSuffix(suffix: string) {
        this.getComponent(Closeable)?.init(suffix);
    }

    protected _closeView() {
        this.getComponent(Closeable)?.onClickClose(void 0, "");
    }
}