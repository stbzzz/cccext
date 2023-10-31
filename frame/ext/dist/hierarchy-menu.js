"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCreateMenu = void 0;
function onCreateMenu(assetInfo) {
    return [
        {
            label: '测试',
            click() {
                console.log('测试');
            },
        },
    ];
}
exports.onCreateMenu = onCreateMenu;
;
