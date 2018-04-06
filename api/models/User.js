/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var crypto = require('crypto');

module.exports = {

    migrate: 'safe',

    attributes: {

        email: {
            type: 'string',
            size: 255,
            minLength: 6,
            maxLength: 255,
            email: true,
            unique: true,
            required: true
        },

        password: {
            type: 'string',
            size: 128,
            minLength: 4,
            maxLength: 128,
            required: true
        },

        firstName: {
            type: 'string',
            size: 20,
            maxLength: 20,
            required: true
//            columnName: 'first_name'
        },

        lastName: {
            type: 'string',
            size: 20,
            maxLength: 20
//            columnName: 'last_name'
        },

        type: {
            type: 'string',
            size: 3,
            minLength: 3,
            maxLength: 3,
            required: true
        },

        quota: {
            type: 'integer',
            number: true,
            required: true
        },

        // validate password
        validate: function(pass) {
            return true;
//            return this.password === crypto.createHash('sha512').update(pass).digest("hex");
        }
    },

    // encrypt password before save
//    beforeCreate: function(values, next) {
//        var pass =  crypto.createHash('sha512').update(values.password).digest("hex");
//        values.password = pass;
//        next();
//    }

};
