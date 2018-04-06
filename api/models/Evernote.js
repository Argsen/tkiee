/**
 * Evernote
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    attributes: {

        userId: {
            type: 'integer',
            number: true,
            required: true
        },

        token: {
            type: 'string',
            size: 255,
            maxLength: 255,
            required: true
        },

        edam: 'text'
    }

};