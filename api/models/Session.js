/**
 * Session
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

//    autoCreatedAt: false,
    autoUpdatedAt: false,

    attributes: {

        name: {
            type: 'string',
            size: 255,
            minLength: 1,
            maxLength: 255,
            required: true
        },

        keyPhase: {
            type: 'string',
            size: 10,
            minLength: 4,
            maxLength: 10,
            unique: true,
            required: true
        },

        password: {
            type: 'string',
            size: 128,
            minLength: 1,
            maxLength: 128,
            required: true
        },

        creatorId: {
            type: 'integer',
            number: true,
            required: true,
            defaultsTo: 0
        },

        isRemote: {
            type: 'boolean',
            required: true,
            defaultsTo: false
        },

        status: {
            type: 'integer',
            number: true,
            required: true,
            defaultsTo: 0
        },

        participant: {
            type: 'integer',
            number: true,
            required: true,
            defaultsTo: 0
        },
		
        isStreaming: {
            type: 'boolean',
            required: true,
            defaultsTo: false
        },		

        startedAt: 'datetime',

        endedAt: 'datetime'

    },

    generateKeyPhase: function(digit) {
        digit = digit || sails.config.CONSTANT.KEYPHASE_DIGIT;

        var text = "";
//        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        for( var i=0; i < digit; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

};
