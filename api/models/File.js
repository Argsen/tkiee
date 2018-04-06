/**
 * File
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    attributes: {

        sessionId: {
            type: 'integer',
            number: true,
            required: true
        },

        userId: {
            type: 'integer',
            number: true,
            required: true
        },

        name: {
            type: 'string',
            size: 255,
            maxLength: 255,
            required: true
        },

        location: {
            type: 'string',
            size: 255,
            maxLength: 255,
            required: true
        },

        type: {
            type: 'string',
            size: 10,
            maxLength: 10,
            required: true
        },

        size: {
            type: 'integer',
            number: true,
            required: true
        },

        order: {
            type: 'integer',
            number: true
        }

    }

};
