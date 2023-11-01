import { Asset, AssetManager, JsonAsset, Prefab, Sprite, SpriteFrame, __private, assetManager, error, isValid, sp } from "cc";
import { PreloadRes } from "../PreloadRes";
import { Cfg } from "./CfgMgr";
import { Singleton } from "./Singleton";

interface ILoadedAsset {
    path: string;
    asset: Asset;
    autorelease: boolean;
}

class ResMgr extends Singleton {

    /**
     * 设置精灵图像
     * @param target 目标精灵
     * @param bundlename 分包名
     * @param path 精灵路径
     * @param autorelease 切换场景时，是否自动删除
     */
    public setSpriteFrame(target: Sprite, bundlename: string, path: string, autorelease = true) {
        this.manualLoadAny(bundlename, `${path}/spriteFrame`, SpriteFrame, (err, asset) => {
            if (err) return error(err);

            if (target && isValid(target)) {
                target.node.active = true;
                target.spriteFrame = asset;
            }
        }, autorelease);
    }

    /**
     * 加载骨骼动画
     * @param bundlename 分包名称
     * @param path 骨骼路径
     * @param onComplete 加载完成回调
     * @param autorelease 切换场景时，是否自动删除
     */
    public loadSpine(bundlename: string, path: string, onComplete?: (err: Error | null, asset: sp.SkeletonData | null) => void, autorelease = true) {
        this.manualLoadAny(bundlename, path, sp.SkeletonData, onComplete, autorelease);
    }

    /**
     * 加载预制体
     * @param bundlename 分包名称
     * @param path 预制体路径
     * @param onComplete 加载完成回调
     * @param autorelease 切换场景时，是否自动删除
     * @returns
     */
    public loadPrefab(bundlename: string, path: string, onComplete?: (err: Error | null, asset: Prefab | null) => void, autorelease = true) {
        this.manualLoadAny(bundlename, path, Prefab, onComplete, autorelease);
    }

    /**
     * 加载目录中的 json 配置
     * @param bundlename 分包名称
     * @param configDir json 目录
     * @param onProgress 进度回调
     * @returns
     */
    public loadConfigs(bundlename: string, configDir: string, onProgressCb?: (progress: number) => void): Promise<boolean> {
        return new Promise((res, _) => {
            this.loadBundle(bundlename)
                .then(bundle => {
                    bundle.loadDir<JsonAsset>(configDir, JsonAsset, (loaded: number, total: number) => {
                        onProgressCb && onProgressCb(loaded / total);
                    }, (err: Error | null, assets: JsonAsset[]) => {
                        if (err) {
                            error(err);
                            res(false);
                            return;
                        }
                        Cfg.initJsonAssets(assets);
                        res(true);
                    });
                }).catch(err => {
                    error(err);
                    res(false);
                });
        });
    }

    /**
     * 加载资源
     * @param bundlename 分包名
     * @param path 资源路径
     * @param type 类型
     * @param onComplete 加载完成回调
     * @param autorelease 切换场景时，是否自动删除
     * @returns
     */
    private manualLoadAny<T extends Asset>(bundlename: string, path: string, type: __private._types_globals__Constructor<T>, onComplete?: (err: Error | null, asset: T | null) => void, autorelease = true) {

        const loadedAsset = this._loadedAssets.get(path);
        if (loadedAsset && isValid(loadedAsset.asset)) {
            return onComplete && onComplete(null, loadedAsset.asset as T);
        }

        this.loadBundle(bundlename)
            .then(bundle => {
                bundle.load<T>(path, type, (err, asset) => {
                    if (err) return onComplete && onComplete(err, null);
                    if (!this._loadedAssets.get(path)) {
                        this._loadedAssets.set(path, { path, asset, autorelease });
                        asset.addRef();
                    }
                    onComplete && onComplete(null, asset);
                });
            }).catch(err => { onComplete && onComplete(err, null); });
    }

    /**
     * 加载分包
     * @param name 分包名称
     * @returns
     */
    private loadBundle(name: string): Promise<AssetManager.Bundle> {
        let bundle = assetManager.getBundle(name);
        if (bundle) return Promise.resolve(bundle);
        return new Promise((res, rej) => {
            assetManager.loadBundle(name, (err, _bundle) => {
                if (err) {
                    rej(err);
                    return;
                }
                res(_bundle);
            });
        });
    }

    //private
    private _preloadRes: PreloadRes = null!;
    private _loadedAssets = new Map<string, ILoadedAsset>();


}

export const Res = ResMgr.getInstance() as ResMgr;