/**
 * NoteShare
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

    tableName: 'note_share',

    attributes: {

        sessionId: {
            type: 'integer',
            number: true,
            required: true
        },

        userId: {
            type: 'integer',
            number: true,
            required: true
        },

        isShare: {
            type: 'boolean',
            required: true
        }

    }

};
