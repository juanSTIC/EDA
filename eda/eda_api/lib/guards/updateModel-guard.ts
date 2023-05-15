import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../module/global/model/index';
import { MD5 } from 'object-hash';
const SEED = require('../../config/seed').SEED;


export const updateModelGuard = async function (req: Request, res: Response, next: NextFunction) {
    let updateToken:String = 'xx';
    try{
        updateToken = req.qs.tks.toString();
    }catch(e){
        console.log(e);
        return next(new HttpException(403, 'valid authentication is requiered'));
    }

    const dia =  new Date();
    let token = dia.getUTCFullYear( ) +  SEED +  dia.getUTCDate()  + dia.getUTCHours();    
    token = MD5(token);
    console.log('Update token: ' +  token );
    // aqui tenemos que implemetar una validación
    if ( updateToken == token ) {
            next();
    } else {
        return next(new HttpException(403, 'valid authentication required'));
    }
};
