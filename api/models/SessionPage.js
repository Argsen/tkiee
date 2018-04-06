/**
 * Page
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    autoPK: false,
    autoCreatedAt: false,
    autoUpdatedAt: false,

    tableName: 'session_page',

    attributes: {

        sessionId: {
            type: 'integer',
            number: true,
            required: true,
            primaryKey: true
        },

        page: {
            type: 'integer',
            number: true,
            required: true
        }

    }

};
