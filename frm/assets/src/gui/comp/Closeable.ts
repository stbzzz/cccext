
import { Component, _decorator } from "cc";
import { Gui } from "../../mgr/GuiMgr";
const { ccclass } = _decorator;

@ccclass('Closeable')
export class Closeable extends Component {

    public init(suffix: string) {
        this._suffix_$abc = suffix;
    }

    public setClickCloseCb(cb: Function) {
        this._clickCloseCb_$abc = cb;
    }

    /**
     * 关闭 view
     *
     * 可绑定点击回调，通过传参 eventData: showType_hideType => 0_0 设置关闭动画
     */
    public onClickClose(_: any, cmd: string) {
        let showType: number | undefined, hideType: number | undefined;
        if (cmd) {
            const cmdArr = cmd.split('_');
            if (cmdArr.length == 2 && Number.isInteger(+cmdArr[0]) && Number.isInteger(+cmdArr[1])) {
                showType = +cmdArr[0];
                hideType = +cmdArr[1];
            }
        }
        this.closeView(showType, hideType);
        this._clickCloseCb_$abc && this._clickCloseCb_$abc();
    }

    public closeView(showType?: number, hideType?: number) {
        const uuid = this._suffix_$abc != '' ? `${this.node.name}_${this._suffix_$abc}` : this.node.name;
        Gui.removeView(uuid, showType, hideType);
    }

    //private
    private _suffix_$abc: string = '';
    private _clickCloseCb_$abc: Function | null = null;

}