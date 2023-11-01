export class Singleton {
    protected constructor() { }
    protected onCreate() { }

    public static getInstance() {
        const cls = this as unknown as any;
        if (cls._instance) return cls._instance;
        let inst = cls._instance = new cls();
        inst.onCreate();
        return inst;
    }
}