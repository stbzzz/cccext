import { Component, IVec2Like, Node, UITransform, Vec3, __private, isValid, v3 } from "cc";

type MixinObj = { [k: string]: string | number };

const Mathround = Math.round;
const Mathfloor = Math.floor;

interface IRay {
    spos: Vec3;
    epos: Vec3;
    angle?: number;
}

export class Util {
    public static isOdd(n: number): boolean {
        return n % 2 === 1 || n % 2 === -1;
    }

    public static keyFromWeight(m: { [k: string]: number }): string {
        let keys: string[] = [];
        let weights: number[] = [];
        let v = 0;
        for (let k in m) {
            v += m[k];
            keys.push(k);
            weights.push(v);
        }
        let r = Math.random() * v;
        for (let i = 0; i < weights.length; i++) {
            if (r < weights[i]) {
                return keys[i];
            }
        }
        return keys[0];
    }

    public static getOrAddComponent<T extends Component>(node: Node, classConstructor: __private.__types_globals__Constructor<T> | __private.__types_globals__AbstractedConstructor<T>): T {
        let comp = node.getComponent(classConstructor);
        if (comp == null) {
            comp = node.addComponent(classConstructor);
        }
        return comp;
    }

    public static getOrAddComponentByName<T extends Component>(node: Node, name: string): T {
        let comp = node.getComponent(name);
        if (comp == null) {
            comp = node.addComponent(name);
        }
        return comp as T;
    }

    /**
     * 生成 `count` 个均匀分布的射线
     * @param spos
     * @param originAngle
     * @param count
     * @param perAngle
     */
    public static rays(spos: Readonly<Vec3>, originAngle: number, count: number, perAngle = 10, distance = 100): IRay[] {
        let startAngle = originAngle - (count - 1) * perAngle / 2;
        let results: IRay[] = [];
        for (let i = 0; i < count; ++i) {
            let angle = startAngle + i * perAngle;
            let x = spos.x + Math.cos(angle / 180 * Math.PI) * distance,
                y = spos.y + Math.sin(angle / 180 * Math.PI) * distance;
            results.push({
                spos: spos.clone(),
                epos: v3(x, y),
                angle
            });
        }
        return results;
    }

    /**
     * 生成 `count` 个呈圆形分布的射线
     * @param spos
     * @param count
     * @returns
     */
    public static circleRays(spos: Vec3, count: number): IRay[] {
        const distance = 100;
        let startAngle = 0;
        let perAngle = 360 / count;
        let results: IRay[] = [];
        for (let i = 0; i < count; ++i) {
            let angle = startAngle + i * perAngle;
            let x = spos.x + Math.cos(angle / 180 * Math.PI) * distance,
                y = spos.y + Math.sin(angle / 180 * Math.PI) * distance;
            results.push({
                spos: spos.clone(),
                epos: v3(x, y),
                angle
            });
        }
        return results;
    }

    /**
     * 预测射线途径点
     * @param spos
     * @param originAngle
     * @param distance
     */
    public static predictPathPoint(spos: Readonly<Vec3>, originAngle: number, distance = 100): Vec3 {
        let x = spos.x + Math.cos(originAngle / 180 * Math.PI) * distance,
            y = spos.y + Math.sin(originAngle / 180 * Math.PI) * distance;
        return v3(x, y);
    }

    /**
     * 世界坐标
     * @param node
     * @param out
     * @returns
     */
    public static worldPos(node: Node, out?: Vec3): Vec3 | null {
        if (isValid(node) && node.parent) {
            if (out) {
                node.parent.getComponent(UITransform)!.convertToWorldSpaceAR(node.position, out);
            }
            return node.parent.getComponent(UITransform)!.convertToWorldSpaceAR(node.position);
        }
        return null;
    }

    /**
     * 是否通过概率
     * @param probability
     * @param base
     * @returns
     */
    public static isPassProbability(probability: number, base = 100): boolean {
        if (probability <= 0) return false;
        if (probability >= base) return true;
        return Math.random() * base < probability;
    }

    /**
     * 从 p1 指向 p2 形成的向量与 (1,0) 向量的夹角
     * @param p1
     * @param p2
     * @param translate
     * @returns
     */
    public static angle(p1: IVec2Like, p2: IVec2Like, translate: boolean = false): number {
        let x1 = p1.x, y1 = p1.y,
            x2 = p2.x, y2 = p2.y;
        let angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        if (translate) {
            return (angle < 0) ? 360 + angle : angle;
        }
        return angle;
    }

    /**
     * 判断目标元素是否在数组中
     * @param arr
     * @param target
     * @returns
     */
    public static isInArray<T>(arr: T[], target: T): boolean {
        return arr.findIndex(v => { return target == v; }) !== -1;
    }

    /**
     * 混合对象
     * type MixinObj = {[k:string]:string|number};
     * @param obj1
     * @param obj2
     * @returns
     */
    public static mixin(obj1: MixinObj, obj2: MixinObj): MixinObj {
        let mixed: MixinObj = {};
        for (let k in obj1) {
            mixed[k] = obj1[k];
        }
        for (let k in obj2) {
            mixed[k] = obj2[k];
        }
        return mixed;
    }

    /**
     *
     * @param origin 原始数据
     * @param fixed 保留小数点后几位，不进行四舍五入
     */
    public static fixDecimal(origin: number, fixed: number): string {
        let scale = Math.pow(10, fixed);
        let curr = Math.floor(origin * scale);
        return (curr / scale).toFixed(fixed);
    }

    /**
     * [n, m] 之间的随机整数
     * @param n
     * @param m
     */
    public static randomIntBtwNM(n: number, m: number): number {
        n = Mathfloor(n)
        m = Mathfloor(m)
        return Mathround(Math.random() * (m - n)) + n;
    }

    /**
     * [0, m-1] 之间的随机整数
     * @param m
     */
    public static randomIntBtwZeroM(m: number): number {
        return Mathfloor(Math.random() * Mathfloor(m));
    }

    /**
     * arr 中随机选择 count 个元素返回
     * @param arr
     * @param count
     */
    public static randomSome<T>(arr: T[], count: number): T[] {
        if (count <= 0) return [];
        if (count >= arr.length) return arr.slice(0);
        let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
        while (i-- > min) {
            index = Mathfloor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(min);
    }

    /**
     * 将数字格式化为诸如 1,000,000 的形式
     * @param n
     * @returns
     */
    public static formatNumber(n: number) {
        if (n <= 0) return '0';
        return n.toFixed(0).replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,')
    }

    /**
     * 返回经过校验的本地时间，到 (s)
     * @param deltaSec (s)
     * @returns
     */
    public static localSec(deltaSec = 0): number {
        return Mathround((new Date).getTime() / 1000) + deltaSec;
    }

    /**
     * 返回经过校验的本地时间，到 (ms)
     * @param deltaSec (s)
     * @returns
     */
    public static localMSec(deltaSec = 0): number {
        return (new Date).getTime() + deltaSec * 1000;
    }

    /**
     * 格式化时间
     * @param fmtStr e.g. 'HH:MM:SS'
     * @param timeDuration (sec) 时间段
     */
    public static fmtTime(fmtStr: string, timeDuration: number) {
        let options = [
            { k: 'H+', v: Mathfloor(timeDuration / 3600).toString() },
            { k: 'M+', v: Mathfloor((timeDuration % 3600) / 60).toString() },
            { k: 'S+', v: (timeDuration % 60).toString() },
        ];

        let opt, ret;
        let len = options.length;
        for (let i = 0; i < len; i++) {
            opt = options[i];
            ret = new RegExp('(' + opt.k + ')').exec(fmtStr);
            if (ret) {
                fmtStr = fmtStr.replace(ret[1], (ret[1].length == 1) ? (opt.v) : Util.prefixZero(parseInt(opt.v)));
            }
        }
        return fmtStr;
    }

    /**
     * 格式化日期
     * @param fmtStr
     * @param timeStamp (sec) 时间戳
     */
    public static fmtDate(fmtStr: string, timeStamp: number) {
        let date = new Date(timeStamp * 1000);
        let options = [
            { k: 'Y+', v: date.getFullYear().toString() },
            { k: 'm+', v: (date.getMonth() + 1).toString() },
            { k: 'd+', v: date.getDate().toString() },
            { k: 'H+', v: date.getHours().toString() },
            { k: 'M+', v: date.getMinutes().toString() },
            { k: 'S+', v: date.getSeconds().toString() },
        ];

        let opt, ret;
        let len = options.length;
        for (let i = 0; i < len; i++) {
            opt = options[i];
            ret = new RegExp('(' + opt.k + ')').exec(fmtStr);
            if (ret) {
                fmtStr = fmtStr.replace(ret[1], (ret[1].length == 1) ? (opt.v) : Util.prefixZero(parseInt(opt.v)));
            }
        }
        return fmtStr;
    }

    /**
     * 小于 10 的数字，前面补 0 返回
     * @param num
     * @returns
     */
    public static prefixZero(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }
}