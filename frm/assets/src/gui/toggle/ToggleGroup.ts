import { _decorator, Component, error, SpriteFrame } from 'cc';
import { BaseToggleButton } from './BaseToggleButton';
const { ccclass, property } = _decorator;

type Handler = (currIndex: number, lastIndex: number) => Promise<boolean>;

@ccclass('ToggleGroup')
export class ToggleGroup extends Component {
    @property(SpriteFrame)
    public normalFrame: SpriteFrame | null = null;
    @property(SpriteFrame)
    public selectedFrame: SpriteFrame | null = null;

    private _toggleButtons: BaseToggleButton[] = [];
    private _lastIndex = -1;
    private _toggleHandler: Handler = null!;
    private _canUnselected = false;
    private _isLocked = false;

    /**
     * 设置选中的 ToggleButton 下标
     * @param index
     * @param invokeClick 是否在设置 index 后，立即调用回调
     */
    public initIndex(index: number, toggleHandler: Handler, invokeClick = false) {
        this.setStyle(index);
        this._toggleHandler = toggleHandler;
        invokeClick && this._toggleHandler(index, -1);
    }

    /**
     * 设置是否可以取消选中，默认不可取消
     */
    public setCanUnselected(b: boolean) {
        this._canUnselected = b;
    }

    /**
     * 设置点击锁定
     */
    public setClickLock(b: boolean) {
        this._isLocked = b;
    }

    protected onLoad(): void {
        for (let l = this.node.children.length, i = 0; i < l; ++i) {
            let node = this.node.children[i];
            let comp = node.getComponent(BaseToggleButton)!;
            comp.setIndex(i);
            comp.setClickHandler(this._onClick.bind(this));
            this._toggleButtons.push(comp);
        }
    }

    private setStyle(index: number) {
        this._lastIndex = index;
        for (let i = 0, l = this._toggleButtons.length; i < l; ++i) {
            let button = this._toggleButtons[i];
            button.setSelectStat(index == i);
        }
    }

    private async _onClick(index: number) {
        if (this._isLocked) return;
        if (this._lastIndex == index) {
            if (this._canUnselected) {
                this._toggleHandler(index, index);
                this.setStyle(-1);
            }
            return;
        }

        let ok = false;
        try {
            ok = await this._toggleHandler(index, this._lastIndex);
        } catch (e) { error(e); }
        ok && this.setStyle(index);
    }
}


