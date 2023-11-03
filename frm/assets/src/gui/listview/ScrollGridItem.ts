import { Component, _decorator } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ScrollGridItem')
export class ScrollGridItem extends Component {

    private _itemClick_$abc: ((cmd: string) => void) | null = null;

    private _data_$abc: any = null!;
    public setData(data: any) {
        this._data_$abc = data;
        this.onUpdateData();
    }

    public get data(): any { return this._data_$abc; }

    public setVisible(bVisible: boolean) {
        this.node.active = bVisible;
    }

    public setClickCb(cb: (cmd: string) => void) {
        this._itemClick_$abc = cb;
    }

    /**
     * 数据更新
     */
    protected onUpdateData() { }

    private onClickItem(_: any, cmd: string) {
        this._itemClick_$abc && this._itemClick_$abc(cmd);
    }
}