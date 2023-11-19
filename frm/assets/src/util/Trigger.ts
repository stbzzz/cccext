export class Trigger {
    public constructor(interval: number) {
        this.reset(interval);
    }

    public reset(interval: number, retainElapsed = false) {
        if (retainElapsed) {
            if (interval > 0 && interval < this._elapsedTime) {
                let multiple = Math.floor(this._elapsedTime / interval);
                this._elapsedTime -= multiple * interval;
            }
        } else {
            this._elapsedTime = 0;
        }

        this._interval = interval;
    }

    public trigger(dt: number): boolean {
        if (this._interval < 0) return false;

        this._elapsedTime += dt;

        if (this._elapsedTime >= this._interval) {
            this._elapsedTime -= this._interval;
            return true;
        }
        return false;
    }

    //private
    private _interval = -1;
    private _elapsedTime = 0;
}