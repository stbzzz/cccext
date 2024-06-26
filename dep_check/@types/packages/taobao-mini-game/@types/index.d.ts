/// <reference path='../../../@types/index'/>

export * from '@editor/library-type/packages/builder/@types/protect';
import { IInternalBuildOptions, IPolyFills, ISettings } from '@editor/library-type/packages/builder/@types/protect';

export type IOrientation = 'landscape' | 'portrait';

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'taobao-mini-game': {
            deviceOrientation: IOrientation;
            globalVariable: string;
        };
    };
}
