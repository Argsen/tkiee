/**
 * Organization
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    attributes: {

        name: {
            type: 'string',
            size: 255,
            minLength: 1,
            maxLength: 255,
            required: true
        }

    }

};
