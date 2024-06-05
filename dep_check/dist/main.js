"use strict";
// 只检测浅依赖
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
const fs = require('fs');
const path = require('path');
let getBundleNameByUrl = (url) => {
    let res = url?.match(/bundles\/(\S*?)\//);
    if (res && res.length > 1) {
        return res[1];
    }
    return "unknown_bundle";
};

let commonDep = {};

let checkSpriteFrameRefs = (fullpath, url) => {
    const currBundleName = getBundleNameByUrl(url);
    // read prefab file
    fs.readFile(fullpath, async (err, data) => {
        if (err) {
            console.error(`读取${fullpath}失败`, err);
            return;
        }
        let deps = JSON.parse(data);
        for (let dep of deps) {
            if (dep['_spriteFrame']) {
                const uuid = dep['_spriteFrame']['__uuid__'];
                let depSpriteFrameUrl = await Editor.Message.request('asset-db', 'query-url', uuid);
                let depSpriteFrameBundleName = getBundleNameByUrl(depSpriteFrameUrl);
                if (depSpriteFrameBundleName == "unknown_bundle") {
                    continue;
                }

                if (depSpriteFrameBundleName != currBundleName) {
                    let ref = depSpriteFrameUrl.substring(depSpriteFrameUrl.indexOf(depSpriteFrameBundleName));
                    let refArr = ref.split("@");
                    if (refArr.length > 0) {
                        ref = refArr[0];
                    }
                    if (depSpriteFrameBundleName == 'common') {
                        if (!commonDep[ref]) {
                            commonDep[ref] = new Map();
                        }
                        commonDep[ref].set(currBundleName, url.substring(url.indexOf(currBundleName)));
                    } else {
                        console.error(`【跨包引用】${url.substring(url.indexOf(currBundleName))} 引用了 ${ref}`);
                    }
                }
            }
        }
    });
};
// scene: cc.SceneAsset
// prefab: cc.Prefab
let checkAssets = (type, printCommon) => {
    Editor.Message.request('asset-db', 'query-assets', { pattern: "db://assets/bundles/**" }).then(list => {
        for (let k in list) {
            let v = list[k];
            if (v.type == type) {
                checkSpriteFrameRefs(v.file, v.url);
            }
        }

        if (printCommon) {
            for (let k in commonDep) {
                let m = commonDep[k];
                if (m.size == 1) {
                    let v;
                    m.forEach(_v => {
                        v = _v;
                    });
                    console.warn(`${k} 被 ${v} 引用`);
                }
            }
        }
    }, (reason) => {
        console.error('checkAssets:err', reason);
    });
};
let savePrefabToBundleInfo = async () => {
    // record all bundles
    let bundles = [];
    let bundleDir = await Editor.Message.request("asset-db", 'query-path', "db://assets/bundles");
    const files = fs.readdirSync(bundleDir);
    files.forEach((f) => {
        let stat = fs.lstatSync(path.join(bundleDir, f));
        if (stat.isDirectory()) {
            bundles.push(path.basename(f));
        }
    });
    // record all prefabs
    let assets = await Editor.Message.request('asset-db', 'query-assets', { pattern: "db://assets/bundles/**" });
    let prefabs = {};
    for (let k in assets) {
        let v = assets[k];
        if (v.type == 'cc.Prefab') {
            let url = v.url;
            let bundleName = getBundleNameByUrl(url);
            if (bundleName == "unknown_bundle")
                continue;
            const basename = path.basename(url, ".prefab");
            if (!prefabs[bundleName]) {
                prefabs[bundleName] = {};
            }
            let index = url.indexOf(bundleName);
            let record = prefabs[bundleName][basename];
            if (record) {
                console.error(`${bundleName}包重名预制体:${url.substring(index)}`);
                continue;
            }
            let surl = url.substring(index + bundleName.length + 1);
            prefabs[bundleName][basename] = surl.substring(0, surl.length - 7);
        }
    }
    // save
    // let obj = { bundles, prefabs };
    // let cfgDir = await Editor.Message.request("asset-db", 'query-path', "db://assets/preload/cfg");
    // fs.writeFileSync(path.join(cfgDir, 'bundle.json'), JSON.stringify(obj));
    // await Editor.Message.request("asset-db", "refresh-asset", "db://assets/preload/cfg");
};
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    // 保存
    onAssetChange(hash, asset) {
        const t = asset.type;
        switch (t) {
            case 'cc.Prefab':
            case 'cc.SceneAsset': {
                checkAssets('cc.Prefab', false);
                checkAssets('cc.SceneAsset', false);
                // savePrefabToBundleInfo();
                break;
            }
        }
    },
    checkCommonDep() {
        checkAssets('cc.Prefab', true);
        checkAssets('cc.SceneAsset', true);
    },
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() { }
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() { }
exports.unload = unload;
