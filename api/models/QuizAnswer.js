/**
 * QuizAnswer
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',

//    autoPK: false,

    tableName: 'quiz_answer',

    attributes: {

        userId: {
            type: 'integer',
            number: true,
            required: true
        },

        quizId: {
            type: 'integer',
            number: true,
            required: true
        },

        answer: 'text'

    }

};
