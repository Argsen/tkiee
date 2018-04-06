/**
 * UserSession
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    autoPK: false,
    autoUpdatedAt: false,

    tableName: 'user_session',

    attributes: {

        userId: {
            type: 'integer',
            number: true,
            required: true
        },

        sessionId: {
            type: 'integer',
            number: true,
            required: true
        }

    }

};
