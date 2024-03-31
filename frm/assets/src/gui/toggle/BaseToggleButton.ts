import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

type Handler = (index: number) => void;

@ccclass('BaseToggleButton')
export class BaseToggleButton extends Component {

    @property(Sprite)
    private btnBg: Sprite = null!;

    private _parent: any = null!;
    private _index: number = 0;
    private _clickHandler: (Handler) | null = null;

    public setIndex(index: number) {
        this._parent = this.node.parent!.getComponent('ToggleGroup')!;
        this._index = index;
    }

    public setClickHandler(handler: Handler) {
        this._clickHandler = handler;
    }

    public setSelectStat(selected: boolean) {
        const frame = this.getToggleFrame(selected);
        if (frame) {
            this.btnBg.spriteFrame = frame;
        }
        this.onSelect(selected);
    }

    protected onSelect(selected: boolean) { }

    private onClick() {
        this._clickHandler && this._clickHandler(this._index);
    }

    private getToggleFrame(selected: boolean): SpriteFrame | null {
        let frame = selected ? this.getSelectedFrame() : this.getNormalFrame();
        if (frame) return frame;
        frame = selected ? this._parent.selectedFrame : this._parent.normalFrame;
        if (frame) return frame;

        return null;
    }

    protected getNormalFrame(): SpriteFrame | null {
        return null;
    }

    protected getSelectedFrame(): SpriteFrame | null {
        return null;
    }
}


