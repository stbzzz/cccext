import { AudioSource, Component, Node, Prefab, _decorator, director } from "cc";
import { Timer } from "./mgr/TimerMgr";

const { ccclass, property } = _decorator;

@ccclass('PreloadRes')
export class PreloadRes extends Component {

    @property(Prefab)
    public toastPrefab: Prefab = null!;

    @property(Prefab)
    public viewMaskPrefab: Prefab = null!;

    @property(Prefab)
    public requestMaskPrefab: Prefab = null!;

    @property(Prefab)
    public loadingMaskPrefab: Prefab = null!;


    protected onLoad(): void {
        director.addPersistRootNode(this.node);
        let musicAudioSourceNode = new Node('MusicAudioSource');
        musicAudioSourceNode.addComponent(AudioSource);
        director.addPersistRootNode(musicAudioSourceNode);
        this.node.addChild(musicAudioSourceNode);
        let effectAudioSourceNode = new Node('EffectAudioSource');
        effectAudioSourceNode.addComponent(AudioSource);
        director.addPersistRootNode(effectAudioSourceNode);
        this.node.addChild(effectAudioSourceNode);
    }

    protected update(dt: number): void {
        Timer.updateLogic(dt);
    }

}