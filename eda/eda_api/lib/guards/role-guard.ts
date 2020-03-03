import {Response, NextFunction} from 'express';
import {IUserRequest} from '../module/global/model/user-request.model';
import HttpException from '../module/global/model/http-exception.model';
import Group from '../module/admin/model/group.model';
import _ = require('lodash');



export const roleGuard = async function (req: IUserRequest, res: Response, next: NextFunction) {
    let userID = req.user._id;

    if ( !_.isNil(userID) ) {
        
        const groups = await Group.find({users: {$in: userID}}).exec();

        const isAdmin = groups.filter(g => g.role === 'ADMIN_ROLE').length > 0;

        if (!isAdmin) {
            return next(new HttpException(403, 'You must need to be admin to acces here'));
        } else {
            next();
        }

    } else {
        return next(new HttpException(403, 'Role required'));
    }
};
