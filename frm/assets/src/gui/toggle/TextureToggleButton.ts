import { SpriteFrame, _decorator } from 'cc';
import { BaseToggleButton } from './BaseToggleButton';
const { ccclass, property } = _decorator;


@ccclass('TextureToggleButton')
export class TextureToggleButton extends BaseToggleButton {

    @property(SpriteFrame)
    private normalFrame: SpriteFrame = null!;
    @property(SpriteFrame)
    private selectedFrame: SpriteFrame = null!;

    protected getNormalFrame(): SpriteFrame | null {
        return this.normalFrame;
    }

    protected getSelectedFrame(): SpriteFrame | null {
        return this.selectedFrame;
    }
}


