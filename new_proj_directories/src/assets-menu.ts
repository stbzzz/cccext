
export function onCreateMenu(assetInfo: any) {
    return [
        {
            label: 'Test',
            click() {
                /**
                 * bundles/
                 *      bundlename1/
                 *      bundlename2/
                 *      bundlename3/
                 * scripts/
                 *      MyApp.ts
                 *      PreloadScene.ts
                 */

                console.log('Test');
            },
        }
    ];
};