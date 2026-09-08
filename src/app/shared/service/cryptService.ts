import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { Observable } from 'rxjs/Observable';
import { Configuration } from '../../app.constants';

@Injectable()
export class CryptoService {
	private key: string;
	private iv: string;
	
    constructor(private _configuration: Configuration) {
		//Encrypt the Passwort with Base64
		this.key = CryptoJS.enc.Base64.parse(_configuration.CryptKey);
		this.iv = CryptoJS.enc.Base64.parse(_configuration.CrtyptIv);
	}
        
    public encrypt(data: any) {
        return CryptoJS.AES.encrypt(data, this.key, { iv: this.iv });
    }

    public decrypt(data: any) {
        var decryptData = CryptoJS.AES.decrypt(data, this.key, { iv: this.iv });
        return decryptData.toString(CryptoJS.enc.Utf8);
    }
}