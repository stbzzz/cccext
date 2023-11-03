import { Color, Label, LabelOutline, _decorator } from 'cc';
import { BaseToggleButton } from './BaseToggleButton';
const { ccclass, property } = _decorator;


@ccclass('FontToggleButton')
export class FontToggleButton extends BaseToggleButton {

    @property(Label)
    private btnText: Label = null!;
    @property(Color)
    private btnTextColors: Color[] = [];
    @property(Color)
    private btnTextOutlineColors: Color[] = [];

    protected onSelect(bSelected: boolean) {
        if (this.btnTextColors.length == 2) {
            this.btnText.color = this.btnTextColors[bSelected ? 1 : 0];
        }
        if (this.btnTextOutlineColors.length == 2) {
            let comp = this.btnText.node.getComponent(LabelOutline);
            if (comp) {
                comp.color = this.btnTextOutlineColors[bSelected ? 1 : 0];
            }
        }
    }

}


