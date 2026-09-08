export interface IToasterConfig {
    positionClass?: string;
    tapToDismiss?: boolean;
    timeout?: number;
    [key: string]: any;
}

export class ToasterConfig implements IToasterConfig {
    positionClass: string;
    tapToDismiss: boolean;
    timeout: number;

    constructor(config: IToasterConfig = {}) {
        this.positionClass = config.positionClass || 'toast-top-right';
        this.tapToDismiss = config.tapToDismiss !== undefined ? config.tapToDismiss : true;
        this.timeout = config.timeout !== undefined ? config.timeout : 5000;
        Object.assign(this, config);
    }
}
