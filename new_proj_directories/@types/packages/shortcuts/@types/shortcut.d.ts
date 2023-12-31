export interface ShortcutItem {
    when: string;
    message: string;
    shortcut: string;
    pkgName: string;
    params?: Array<string | number | boolean>;
    rawShortcut?: string;
    key: string;
    missing?: boolean;
}

export type IShortcutItemMap = Record<string, ShortcutItem>;

export interface IShortcutEditInfo {
    key: string;
    shortcut: string;
    searches: ShortcutItem[];
    conflict: boolean;
    when: string;
}
