/**
 * Feedback_option
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

//    autoPK: false,
    autoCreatedAt: false,
    autoUpdatedAt: false,

    tableName: 'feedback_option',

    attributes: {

        feedback: {
            type: 'string',
            size: 255,
            maxLength: 255,
            required: true
        }

    }

};
