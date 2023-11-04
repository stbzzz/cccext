export function onCreateMenu(assetInfo: any) {
    return [
        {
            label: '项目基础目录',
            click() {
                /**
                 * bundles/
                 *      common/
                 *          remove_me.json
                 *      bundlename1/
                 *      bundlename2/
                 *      bundlename3/
                 * preload/
                 *      conf/
                 *          game.json
                 * scripts/
                 *      conf/
                 *          Config.ts
                 *          CommonDefine.ts
                 *          Server.ts
                 *      data/
                 *          AuthData.ts
                 *      gui/
                 *          common/
                 *              remove_me.json
                 *          bundlename1/
                 *          bundlename2/
                 *          bundlename3/
                 *          SplashScene.ts
                 *      MyApp.ts
                 */

                Editor.Message.send('asset-db', 'create-asset', 'db://assets/bundles/common/remove_me.json', `["删除我，我是占位文件"]`);
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/preload/conf/game.json', `{
    "mode": "dev",
    "version": "1.0.0",
    "servers": {
        "dev": {
            "ws": "ws://192.168.3.113:8822/fight",
            "http": "http://192.168.3.113:8820"
        },
        "debug": {},
        "release": {}
    }
}
                `);
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/conf/Config.ts', "export namespace nscfg {}");
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/conf/CommonDefine.ts', "export namespace nscommon {}");
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/conf/Server.ts', "export namespace nssvr {}");
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/data/AuthData.ts', `import { BaseData } from "../../../extensions/frm/assets/src/mgr/DataMgr";

export class AuthData extends BaseData {
}
                `);
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/gui/common/remove_me.json', `["删除我，我是占位文件"]`);
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/gui/SplashScene.ts', `import { BaseScene } from "../../../extensions/frm/assets/src/gui/BaseScene";

import { _decorator } from "cc";

const { ccclass } = _decorator;

@ccclass('SplashScene')
export class SplashScene extends BaseScene {

}
                `);
                Editor.Message.send('asset-db', 'create-asset', 'db://assets/scripts/MyApp.ts', `import { _decorator } from "cc";
import { App } from "../../extensions/frm/assets/src/App";
import { frm } from "../../extensions/frm/assets/src/Defines";
import { Data } from "../../extensions/frm/assets/src/mgr/DataMgr";
import { AuthData } from "./data/AuthData";

const { ccclass } = _decorator;

@ccclass('MyApp')
export class MyApp extends App {
    protected onCreate(gameConfig: frm.IGameConfig) {
        Data.addData(new AuthData('auth', 100));
    }
}
                `);
            },
        }
    ];
};