import { Color, Component, Label, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Toast')
export class Toast extends Component {
    @property(Label)
    private text: Label = null!;

    public setText(msg: string, colorHex = '#FFFFFF') {
        this.text.string = msg;
        this.text.color = new Color(colorHex);
    }
}