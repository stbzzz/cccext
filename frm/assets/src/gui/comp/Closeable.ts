
import { Component, _decorator } from "cc";
import { Gui } from "../../mgr/GuiMgr";
const { ccclass } = _decorator;

@ccclass('Closeable')
export class Closeable extends Component {

    public init(suffix: string) {
        this._suffix_$abc = suffix;
    }

    /**
     * 关闭 view
     * 
     * 可绑定点击回调，通过传参 eventData: showType_hideType => 0_0 设置关闭动画
     */
    public onClickClose(_: any, cmd: string) {
        const uuid = this._suffix_$abc != '' ? `${this.node.name}_${this._suffix_$abc}` : this.node.name;
        let showType = 0, hideType = 0;
        if (cmd) {
            const cmdArr = cmd.split('_');
            if (cmdArr.length == 2 && Number.isInteger(+cmdArr[0]) && Number.isInteger(+cmdArr[1])) {
                showType = +cmdArr[0];
                hideType = +cmdArr[1];
            }
        }
        Gui.removeView(uuid, showType, hideType);
    }

    //private
    private _suffix_$abc: string = '';

}