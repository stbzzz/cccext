export function onCreateMenu(assetInfo: any) {
    return [
        {
            label: '测试',
            click() {
                console.log('测试');
            },
        },
    ];
};