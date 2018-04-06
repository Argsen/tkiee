/**
 * Translation
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    attributes: {

        word: {
            type: 'string',
            size: 255,
            maxLength: 255,
            required: true
        },

        language: {
            type: 'string',
            size: 16,
            maxLength: 16,
            required: true
        },

        translation: {
            type: 'text',
            required: true
        }

    }

};
