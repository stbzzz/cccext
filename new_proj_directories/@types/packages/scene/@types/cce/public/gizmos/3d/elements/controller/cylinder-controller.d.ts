import EditableController from './editable-controller';
import { IControlMouseEvent } from '../../../defines';
import { Color, Node, Vec3, EAxisDirection } from 'cc';
declare class CylinderController extends EditableController {
    get radius(): number;
    set radius(value: number);
    get height(): number;
    set height(value: number);
    get direction(): EAxisDirection;
    set direction(value: EAxisDirection);
    private _oriDir;
    private _direction;
    private _center;
    private _radius;
    private _height;
    private _halfHeight;
    private _deltaRadius;
    private _deltaHeight;
    private _mouseDeltaPos;
    private _curDistScalar;
    private _upperCapMC;
    private _lowerCapMC;
    private _sideLineMC;
    private _upperCapNode;
    private _lowerCapNode;
    private _sideLineNode;
    private _up;
    private _right;
    private _forward;
    private _directionAxis;
    constructor(rootNode: Node);
    setColor(color: Color): void;
    _updateEditHandle(axisName: string): void;
    initShape(): void;
    updateSize(center: Vec3, radius: number, height: number): void;
    onMouseDown(event: IControlMouseEvent): void;
    onMouseMove(event: IControlMouseEvent): void;
    onMouseUp(event: IControlMouseEvent): void;
    onMouseLeave(event: IControlMouseEvent): void;
    getDeltaRadius(): number;
    getDeltaHeight(): number;
    private getUpperCapData;
    private getLowerCapData;
    private getSideLinesData;
}
export default CylinderController;
//# sourceMappingURL=cylinder-controller.d.ts.map