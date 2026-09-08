export interface IMyDate {
    year: number;
    month: number;
    day: number;
}

export interface IMyDateModel {
    date: IMyDate;
    jsdate: Date;
    formatted: string;
    epoc: number;
}

// Loosely typed to match the real mydatepicker@9.0.2 IMyOptions shape closely
// enough that existing option object literals across the app keep type-checking,
// without this shim needing to implement every cosmetic property.
export interface IMyOptions {
    dateFormat?: string;
    inline?: boolean;
    height?: string;
    width?: string;
    componentDisabled?: boolean;
    selectionTxtFontSize?: string;
    editableDateField?: boolean;
    sunHighlight?: boolean;
    satHighlight?: boolean;
    firstDayOfWeek?: string;
    openSelectorTopOfInput?: boolean;
    openSelectorOnInputClick?: boolean;
    selectorHeight?: string;
    selectorWidth?: string;
    disableSince?: IMyDate;
    disableUntil?: IMyDate;
    showWeekNumbers?: boolean;
    showTodayBtn?: boolean;
    showClearDateBtn?: boolean;
    [key: string]: any;
}

export type IMyDpOptions = IMyOptions;
