import { _decorator, Component, Node } from 'cc';
import { frm } from '../../Defines';

const { ccclass } = _decorator;

/**
 * 单行或者单列
 */
@ccclass('ScrollRowOrColItem')
export class ScrollRowOrColItem extends Component {

    /**
     * 行标或者列标
     */
    public set rowOrCol(i: number) { this._rowOrCol_$abc = i; }
    public get rowOrCol(): number { return this._rowOrCol_$abc; }
    private _rowOrCol_$abc = 0;

    /**
     * 点击 Item 回调
     */
    public set itemClick(cb: frm.ListViewItemClick<any>) { this._itemClick_$abc = cb; }
    private _itemClick_$abc: frm.ListViewItemClick<any> = null!;

    /**
     * 数据
     */
    public setData(v: any) { this._data_$abc = v; this.onUpdateData(); }
    public get data(): any { return this._data_$abc; }
    private _data_$abc: any = null!;

    /**
     * 数据更新
     */
    protected onUpdateData() { }

    protected onClickItem(_: any, cmd: string) {
        if (this._itemClick_$abc) this._itemClick_$abc(this.node, this._data_$abc, cmd);
    }

    protected _proxyChildClick(child: Node, index: number, cmd: string) {
        if (this._itemClick_$abc) this._itemClick_$abc(child, this._data_$abc[index], cmd);
    }

    /**
     * 宽度
     * Prefab 需要子类提供宽度
     * @param data
     */
    public preCalcWidth(data: any): number { return 0; }

    /**
     * 高度
     * Prefab 需要子类提供高度
     */
    public preCalcHeight(data: any): number { return 0; }
}