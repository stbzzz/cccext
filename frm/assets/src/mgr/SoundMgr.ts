import { AudioSource, Node, error } from "cc";
import { Res } from "./ResMgr";
import { Singleton } from "./Singleton";

const MUSIC_VOLUME_KEY = 'BgmVolume';
const EFFECT_VOLUME_KEY = 'EffectVolume';

// milli secs
const PLAY_EFFECT_INTERVAL = 100;

export class SoundMgr extends Singleton {

    public init(appNode: Node) {
        this._musicAudioSource = appNode.getChildByName('MusicAudioSource')?.getComponent(AudioSource)!;
        this._effectAudioSource = appNode.getChildByName('EffectAudioSource')?.getComponent(AudioSource)!;

        this._musicVolume = +(localStorage.getItem(MUSIC_VOLUME_KEY) || 1);
        this._effectVolume = +(localStorage.getItem(EFFECT_VOLUME_KEY) || 1);
    }

    public pause() {
        this._musicAudioSource.pause();
    }

    public resume() {
        this._musicAudioSource.play();
    }

    public playMusic(path: string, multiple = 1) {
        Res.loadAudio(path, (err, clip) => {
            if (err) {
                error(err);
                return;
            }
            this._musicAudioSource.stop();
            this._musicAudioSource.clip = clip;
            this._musicAudioSource.volume = this._musicVolume * multiple;
            this._musicAudioSource.loop = true;
            this._musicAudioSource.play();
        }, false);
    }

    public setMusicVolume(v: number) {
        this._musicVolume = v;
        this._musicAudioSource.volume = v;
        localStorage.setItem(MUSIC_VOLUME_KEY, `${v}`);
    }

    public getMusicVolume(): number {
        return this._musicVolume;
    }

    public playEffect(path: string, multiple = 1) {
        const curr = (new Date()).getTime();
        const last = this._frequencyMap.get(path) || 0;
        if (curr - last < PLAY_EFFECT_INTERVAL) {
            return;
        }
        this._frequencyMap.set(path, curr);
        Res.loadAudio(path, (err, clip) => {
            if (err) {
                error(err);
                return;
            }
            this._effectAudioSource.playOneShot(clip!, this._effectVolume * multiple);
        }, false);
    }

    public setEffectVolume(v: number) {
        this._effectVolume = v;
        localStorage.setItem(EFFECT_VOLUME_KEY, `${v}`);
    }

    public getEffectVolume(): number {
        return this._effectVolume;
    }

    private _musicVolume = 1;
    private _effectVolume = 1;
    private _musicAudioSource: AudioSource = null!;
    private _effectAudioSource: AudioSource = null!;

    private _frequencyMap = new Map<string, number>();
}

export const Sound = SoundMgr.getInstance() as SoundMgr;