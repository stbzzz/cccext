"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCreateMenu = void 0;
function onCreateMenu(assetInfo) {
    return [
        {
            label: 'Test',
            click() {
                console.log('Test');
            },
        }
    ];
}
exports.onCreateMenu = onCreateMenu;
;
