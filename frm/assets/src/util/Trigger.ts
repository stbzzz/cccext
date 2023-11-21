export class Trigger {
    public constructor(interval: number, autoReset = true) {
        this._autoReset = autoReset;
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

    public isTriggered(): boolean { return this._triggered; }
    public resetTriggered() { this._triggered = false; }
    public setTriggeredWhenEnter() {
        this._elapsedTime = this._interval;
    }

    public trigger(dt: number): boolean {
        if (this._interval < 0) return false;

        if (!this._autoReset && this._triggered) return true;

        this._elapsedTime += dt;

        if (this._elapsedTime >= this._interval) {
            this._triggered = true;
            this._elapsedTime -= this._interval;
            return true;
        }
        return false;
    }

    //private
    private _interval = -1;
    private _elapsedTime = 0;
    private _autoReset = true;
    private _triggered = false;
}