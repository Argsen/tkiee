/**
 * Organization_user
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

    autoPK: false,

    tableName: 'organization_user',

    attributes: {

        organizationId: {
            type: 'integer',
            number: true,
            required: true
        },

        userId: {
            type: 'integer',
            number: true,
            required: true
        }

    }

};
