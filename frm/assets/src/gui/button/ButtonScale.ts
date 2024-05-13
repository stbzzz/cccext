import { _decorator, Button, CCFloat, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ButtonScale')
export class ButtonScale extends Component {

    @property(CCFloat)
    private zommScale = 0.95;
    @property(CCFloat)
    private duration = 0.05;

    protected onLoad(): void {
        let button = this.node.getComponent(Button);
        if (button) {
            button.zoomScale = this.zommScale;
            button.duration = this.duration;
            button.transition = Button.Transition.SCALE;
        }
    }

    public setZoomScale(scale: number) {
        this.zommScale = scale;
        let button = this.node.getComponent(Button);
        if (button) {
            button.zoomScale = this.zommScale;
        }
    }
}


