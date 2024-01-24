
import { Foundation } from "./Foundation";
import { Closeable } from "./comp/Closeable";

export class BaseView extends Foundation {
    public get data(): any { return this._data_$abc; }
    public init(suffix: string, data: any) {
        this.getComponent(Closeable)?.init(suffix);

        this._data_$abc = data;
    }

    public isVisible(): boolean {
        return this.node.active;
    }
    public setVisible(visible: boolean) {
        this.node.active = visible;
    }

    /**
     * 当 View 显示的时候调用
     *
     * 子类未实现 onShow ，则无动画，直接显示。
     *
     * 系统默认情况下，使用 `showType=0` 执行进场动画。
     *
     * @example
     * ```
     * public onShow(type: number):boolean {
     *      switch (type) {
     *          case 0: {
     *              // 系统默认调用的动画实现
     *              return true;
     *          }
     *          case 1: {
     *              // 可实现由 showType = 1 指定的动画
     *              return true;
     *          }
     *      }
     *      return false;
     * }
     * ```
     *
     * @param isCreate 来自于创建
     * @returns 是否使用特定动画
     */
    public onShow(type: number, isCreate: boolean): boolean {
        return false;
    }

    /**
     * 当 View 隐藏的时候调用
     *
     * @param isDestroy 来自于销毁; 子类需要根据 `isDestroy` 来决定是否执行 `node.destroy()`
     * @returns 是否使用特定动画
     */
    public onHide(type: number, isDestroy: boolean): boolean {
        return false;
    }

    //private
    private _data_$abc: any = null;

}