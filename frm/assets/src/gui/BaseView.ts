
import { Foundation } from "./Foundation";

export class BaseView extends Foundation {
    public get data(): any { return this._data_$abc; }
    public init(data: any) { this._data_$abc = data; }

    public isVisible(): boolean {
        return this.node.active;
    }
    public setVisible(visible: boolean) {
        this.node.active = visible;
    }

    /**
     * 当 View 显示的时候调用
     *
     * 默认行为：无动画直接显示，与 `type` 值无关
     * @param type
     */
    public onShow(type: number) {
        this.setVisible(true);
    }

    /**
     * 当 View 隐藏的时候调用
     *
     *
     * 默认行为：无动画直接隐藏，与 `type` 值无关
     * @param type
     * @param completeDestroy
     */
    public onHide(type: number, completeDestroy = false) {
        this.setVisible(false);
        if (completeDestroy) {
            this.node.destroy();
        }
    }

    //private
    private _data_$abc: any = null;

}