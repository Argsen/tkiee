/**
 * Translation
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    tableName: 'translation_custom',

    attributes: {

        userId: {
            type: 'integer',
            number: true,
            required: true,
            defaultsTo: 0
        },	

        sessionId: {
            type: 'integer',
            number: true,
            required: true,
            defaultsTo: 0
        },

        organizationId: {
            type: 'integer',
            number: true,
            required: true,
            defaultsTo: 0
        },
		
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
