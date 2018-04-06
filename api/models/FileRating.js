/**
 * File_Rating
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',
	
	tableName: 'file_rating',

    attributes: {

        fileId: {
            type: 'integer',
            number: true,
            required: true
        },

        rating: {
            type: 'integer',
            number: true,
            required: true
        },

		info: 'text',
		
        tag: 'text'

    }

};
