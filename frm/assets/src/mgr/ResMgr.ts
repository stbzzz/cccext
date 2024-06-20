import { Asset, AssetManager, AudioClip, ImageAsset, JsonAsset, Node, Prefab, Sprite, SpriteFrame, Texture2D, Widget, __private, assetManager, director, error, find, isValid, sp, warn } from "cc";
import { DEBUG } from "cc/env";
import { frm } from "../Defines";
import { PreloadRes } from "../PreloadRes";
import { BaseScene } from "../gui/BaseScene";
import { Cfg } from "./CfgMgr";
import { Singleton } from "./Singleton";

interface ILoadedAsset {
    path: string;
    asset: Asset;
    autorelease: boolean;
}

class ResMgr extends Singleton {

    public clear() {
        this._layerCache = {};
        this.releaseManualLoaded();
        this.releaseRemoteImages();
    }

    /**
     * 加载远程json，这个接口不会reject。需要判断返回值是否为空
     * @param url
     * @returns
     */
    public loadRemoteJson(url: string): Promise<Record<string, any> | null> {
        return new Promise((res, rej) => {
            assetManager.loadRemote<JsonAsset>(url, (err, asset) => {
                if (err) {
                    error(err);
                    return res(null);
                }
                res(asset.json);
            });
        });
    }

    /**
    * 加载远程图片
    * @param target
    * @param url
    * @returns
    */
    public loadRemoteImage(target: Sprite, url: string) {
        if (!url || url == "") return;
        url = decodeURI(url);
        assetManager.loadRemote<ImageAsset>(url, (err, asset) => {
            if (err) return error(err);
            this._remoteImages.set(url, asset);
            let frame = new SpriteFrame();
            let texture = new Texture2D();
            texture.image = asset;// cached by assetManager; default: refCount = 0
            frame.texture = texture;
            frame.packable = true;
            if (isValid(target)) {
                target.node.active = true;
                target.spriteFrame = frame;
            }
        });
    }

    /**
     * 删除远程加载的图片
     */
    public releaseRemoteImages() {
        this._remoteImages.forEach(v => {
            assetManager.releaseAsset(v);
        });
        this._remoteImages.clear();
    }

    /**
     * 获取当前场景
     *
     * XXXScene 继承自 BaseScene，且挂载在 Canvas 下
     * @returns
     */
    public getScene<T extends BaseScene>(classConstructor: __private._types_globals__Constructor<T> | __private._types_globals__AbstractedConstructor<T>): T {
        return director.getScene()!.getChildByName('Canvas')!.getComponent(classConstructor)!;
    }

    /**
     * 加载场景
     * @param path
     * @param onProgressCb
     */
    public loadScene(path: string, onProgressCb?: (progress: number) => void, onComplete?: () => void) {
        const pathArr = path.split('/');
        const len = pathArr.length;
        if (len < 2) {
            warn('[Res.loadScene] invalid path: ', path);
            return;
        }
        const bundlename = pathArr[0];
        const scenename = pathArr[len - 1];
        this.loadBundle(bundlename)
            .then(bundle => {
                if (onProgressCb) {
                    let progress = 0;
                    bundle.preloadScene(scenename, (c, t) => {
                        let p = c / t;
                        if (p > progress) {
                            progress = p;
                            onProgressCb(progress);
                        }
                    }, err => {
                        if (err) {
                            error(err);
                            return;
                        }
                        onComplete && onComplete();
                        director.loadScene(scenename);
                    });
                } else {
                    bundle.preloadScene(scenename, err => {
                        if (err) {
                            error(err);
                            return;
                        }
                        onComplete && onComplete();
                        director.loadScene(scenename);
                    });
                }
            }).catch(err => {
                error(err);
            });
    }

    /**
     * 设置精灵图像
     * @param target 目标精灵
     * @param path 精灵路径
     * @param autorelease 切换场景时，是否自动删除
     */
    public setSpriteFrame(target: Sprite, path: string, autorelease = true) {
        this.setSpriteFrameWithCb(target, path, void 0, autorelease);
    }

    public setSpriteFrameWithCb(target: Sprite, path: string, successCb?: Function, autorelease = true) {
        const pathArr = path.split('/');
        const len = pathArr.length;
        if (len < 2) {
            warn('[Res.setSpriteFrame] invalid path: ', path);
            return;
        }
        const bundlename = pathArr[0];
        this.manualLoadAny(bundlename, `${pathArr.slice(1).join('/')}/spriteFrame`, SpriteFrame, (err, asset) => {
            if (err) return error(err);

            if (target && isValid(target)) {
                target.node.active = true;
                target.spriteFrame = asset;
                successCb && successCb();
            }
        }, autorelease);
    }

    /**
     * 加载骨骼动画
     * @param path 骨骼路径
     * @param onComplete 加载完成回调
     * @param autorelease 切换场景时，是否自动删除
     */
    public loadSpine(path: string, onComplete?: (err: Error | null, asset: sp.SkeletonData | null) => void, autorelease = true) {
        const pathArr = path.split('/');
        const len = pathArr.length;
        if (len < 2) {
            warn('[Res.loadSpine] invalid path: ', path);
            return;
        }
        const bundlename = pathArr[0];
        this.manualLoadAny(bundlename, pathArr.slice(1).join('/'), sp.SkeletonData, onComplete, autorelease);
    }

    /**
     * 加载音频
     * @param path
     * @param onComplete
     * @param autorelease
     * @returns
     */
    public loadAudio(path: string, onComplete?: (err: Error | null, asset: AudioClip | null) => void, autorelease = true) {
        const pathArr = path.split('/');
        const len = pathArr.length;
        if (len < 2) {
            warn('[Res.loadSpine] invalid path: ', path);
            return;
        }
        const bundlename = pathArr[0];
        this.manualLoadAny(bundlename, pathArr.slice(1).join('/'), AudioClip, onComplete, autorelease);
    }

    /**
     * 加载预制体
     * @param path 预制体路径
     * @param onComplete 加载完成回调
     * @param autorelease 切换场景时，是否自动删除
     * @returns
     */
    public loadPrefab(path: string, onComplete?: (err: Error | null, asset: Prefab | null) => void, autorelease = true) {
        const pathArr = path.split('/');
        const len = pathArr.length;
        if (len < 2) {
            warn('[Res.loadPrefabAsync] invalid path: ', path);
            return Promise.resolve(null);
        }
        const bundlename = pathArr[0];
        this.manualLoadAny(bundlename, pathArr.slice(1).join('/'), Prefab, onComplete, autorelease);
    }

    /**
     * 加载预制体
     * @param path
     * @param autorelease
     * @returns
     */
    public loadPrefabAsync(path: string, autorelease = true): Promise<Prefab | null> {
        return new Promise((res, _) => {
            this.loadPrefab(path, (err, asset) => {
                if (err) {
                    return res(null);
                }
                res(asset);
            }, autorelease);
        });
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
     * 释放当前场景手动加载且标记为 `autorelease=true` 的所有资源
     */
    private releaseManualLoaded() {
        // @FIXME
        if (1 == 1) return;
        this._loadedAssets.forEach(loadedAsset => {
            if (loadedAsset.autorelease) {
                if (isValid(loadedAsset.asset)) {
                    if (DEBUG) {
                        console.log(`%c[releaseManualLoaded] ${loadedAsset.path} refCount = ${loadedAsset.asset.refCount}`, 'color:#9e315e;');
                    }
                    loadedAsset.asset.decRef();
                }
                this._loadedAssets.delete(loadedAsset.path);
            }
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
                        // @FIXME
                        // asset.addRef();
                        if (DEBUG) {
                            console.log(`%c[manualLoadAny] ${type.name} ${path} refCount = ${asset.refCount}`, 'color:#9e315e;');
                        }
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
    public loadBundle(name: string): Promise<AssetManager.Bundle> {
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

    /**
     * UI 跟节点
     * @param rootName
     * @returns
     */
    public getRoot(rootName: string): Node {
        let root = this._layerCache[rootName];
        if (isValid(root)) {
            return root;
        }
        // this.initLayers();
        return this._layerCache[rootName]!;
    }

    public initLayers() {
        let canvas = find('Canvas')!;
        for (let name of frm.Layers) {
            if (!canvas.getChildByName(name)) {
                let node = new Node(name);
                canvas.addChild(node);
                let comp = node.addComponent(Widget);
                comp.isAlignLeft = comp.isAlignRight = comp.isAlignTop = comp.isAlignBottom = true;
                comp.left = comp.right = comp.top = comp.bottom = 0;
                comp.alignMode = 2;
                comp.enabled = true;
                this._layerCache[name] = node;
            }
        }
    }

    public get preloaded(): PreloadRes {
        if (this._preloadRes) return this._preloadRes;
        return this._preloadRes = find('__app__')!.getComponent(PreloadRes)!;
    }

    //private
    private _preloadRes: PreloadRes = null!;
    private _layerCache: { [key: string]: Node } = {};
    private _loadedAssets = new Map<string, ILoadedAsset>();
    private _remoteImages = new Map<string, ImageAsset>();
}

export const Res = ResMgr.getInstance() as ResMgr;