
async function createNode(prefabName: string) {
    const parentUuid = Editor.Selection.getSelected('node')[0];
    const uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://frm/res/prefabs/${prefabName}.prefab`);
    Editor.Message.send('scene', 'create-node', { parent: parentUuid!, assetUuid: uuid! });

}

export function onCreateMenu(assetInfo: any) {
    return [
        {
            label: 'View',
            submenu: [
                {
                    label: 'CloseableView',
                    click() {
                        createNode('CloseableView');
                    },
                },
                {
                    label: 'BlankCloseableView',
                    click() {
                        createNode('BlankCloseableView');
                    },
                }
            ]
        },
        {
            label: 'Widget',
            click() {
                console.log('Widget');
            },
        },
        {
            label: 'ScrollView',
            submenu: [
                {
                    label: 'VerticalScrollView_GridItem',
                    click() {
                        createNode('VerticalScrollView_GridItem');
                    },
                },
                {
                    label: 'VerticalScrollView_RowOrColItem',
                    click() {
                        createNode('VerticalScrollView_RowOrColItem');
                    },
                },
                {
                    label: 'HorizontalScrollView_GridItem',
                    click() {
                        createNode('HorizontalScrollView_GridItem');
                    },
                },
                {
                    label: 'HorizontalScrollView_RowOrColItem',
                    click() {
                        createNode('HorizontalScrollView_RowOrColItem');
                    },
                }
            ]
        },
        {
            label: 'ToggleGroup',
            submenu: [
                {
                    label: 'FontToggleGroup',
                    click() {
                        createNode('FontToggleGroup');
                    },
                },
                {
                    label: 'TextureToggleGroup',
                    click() {
                        createNode('TextureToggleGroup');
                    },
                }
            ]
        },
    ];
};