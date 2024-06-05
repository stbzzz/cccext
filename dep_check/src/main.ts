
// 只检测浅依赖

const fs = require('fs');
const path = require('path');

let getBundleNameByUrl = (url: string): string => {
    let res = url?.match(/bundles\/(\S*?)\//)
    if (res && res.length > 1) {
        return res[1];
    }
    return "unknown_bundle";
};

let checkSpriteFrameRefs = (fullpath: string, url: string) => {
    const currBundleName = getBundleNameByUrl(url);
    // read prefab file
    fs.readFile(fullpath, async (err: Error, data: any) => {
        if (err) {
            console.error(`读取${fullpath}失败`, err);
            return;
        }
        let deps = JSON.parse(data);
        for (let dep of deps) {
            if (dep['_spriteFrame']) {
                const uuid = dep['_spriteFrame']['__uuid__'];
                let depSpriteFrameUrl: string = await Editor.Message.request('asset-db', 'query-url', uuid);
                let depSpriteFrameBundleName = getBundleNameByUrl(depSpriteFrameUrl);
                if (depSpriteFrameBundleName == "unknown_bundle" || depSpriteFrameBundleName == "common") {
                    continue;
                }
                if (depSpriteFrameBundleName != currBundleName) {
                    let ref = depSpriteFrameUrl.substring(depSpriteFrameUrl.indexOf(depSpriteFrameBundleName));
                    let refArr = ref.split("@");
                    if (refArr.length > 0) {
                        ref = refArr[0];
                    }
                    console.error(`【跨包引用】${url.substring(url.indexOf(currBundleName))} 引用了 ${ref}`);
                }
            }
        }
    });
};

// scene: cc.SceneAsset
// prefab: cc.Prefab
let checkAssets = (type: string) => {
    Editor.Message.request('asset-db', 'query-assets', { pattern: "db://assets/bundles/**" }).then(list => {
        for (let k in list) {
            let v = list[k];
            if (v.type == type) {
                checkSpriteFrameRefs(v.file, v.url);
            }
        }
    }, (reason: any) => {
        console.error('checkAssets:err', reason);
    })
};

let savePrefabToBundleInfo = async () => {

    // record all bundles
    let bundles: string[] = [];
    let bundleDir = await Editor.Message.request("asset-db", 'query-path', "db://assets/bundles");
    const files = fs.readdirSync(bundleDir);
    files.forEach((f: any) => {
        let stat = fs.lstatSync(path.join(bundleDir, f));
        if (stat.isDirectory()) {
            bundles.push(path.basename(f));
        }
    });

    // record all prefabs
    let assets = await Editor.Message.request('asset-db', 'query-assets', { pattern: "db://assets/bundles/**" });
    let prefabs: { [bundleName: string]: { [prefabName: string]: string } } = {};
    for (let k in assets) {
        let v = assets[k];
        if (v.type == 'cc.Prefab') {
            let url = v.url;
            let bundleName = getBundleNameByUrl(url);
            if (bundleName == "unknown_bundle") continue;
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
export const methods: { [key: string]: (...any: any) => any } = {
    // 保存
    onAssetChange(hash: string, asset) {
        const t = asset.type;
        switch (t) {
            case 'cc.Prefab':
            case 'cc.SceneAsset': {
                checkAssets(t);
                // savePrefabToBundleInfo();
                break;
            }
        }
    },
    log() { console.log('Hello World') },
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { }

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }
