/**
 * Feedback
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

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

        feedbackOptionId: 'integer',

        count: {
            type: 'integer',
            number: true,
            required: true
        }

    }

};
