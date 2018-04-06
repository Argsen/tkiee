/**
 * Comment
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',
	
    autoCreatedAt: false,
    autoUpdatedAt: false,

    tableName: 'log_action',
	
    attributes: {

        activity: {
            type: 'string',
            size: 255,
            maxLength: 255,
            required: true
        }

    }

};
