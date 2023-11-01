export namespace frm {

    /**
     * 发布类型
     */
    export const Mode = {
        Dev: 'dev',
        Debug: 'debug',
        Release: 'release',
    }

    interface IServerConfig {
        ws?: string;
        http?: string;
    }

    /**
     * 游戏配置
     */
    export interface IGameConfig {
        mode: string;
        version: string;
        servers: { [mode: string]: IServerConfig };
    }


}