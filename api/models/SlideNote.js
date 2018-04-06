/**
 * SlideText
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    tableName: 'slide_note',

    attributes: {

        sessionId: {
            type: 'integer',
            number: true,
            required: true
        },

        fileId: {
            type: 'integer',
            number: true,
            required: true
        },

        page: {
            type: 'integer',
            number: true,
            required: true
        },

        content: 'text'

    }

};
