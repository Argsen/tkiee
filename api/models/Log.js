/**
 * Comment
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',
	
	autoUpdatedAt: false,

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

        action: 'text'

    }

};
