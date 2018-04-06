/**
 * Quiz
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    autoUpdatedAt: false,

    attributes: {

        sessionId: {
            type: 'integer',
            number: true,
            required: true
        },

        page: {
            type: 'integer',
            number: true,
            required: true
        },

        question: {
            type: 'text',
            required: true
        },

        options: {
            type: 'integer',
            number: true
        },

        keyword: {
            type: 'string'
        },
		
		fileId: {
			type: 'integer',
			number: true,
			required: true
		}

    }

};
