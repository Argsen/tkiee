/**
 * Permission
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    autoCreatedAt: false,

    attributes: {

        userType: {
            type: 'string',
            size: 3,
            minLength: 3,
            maxLength: 3,
            required: true
        },

        description: 'text'
    }

};
