/**
 * FeedbackController
 *
 * @module      :: Controller
 * @description    :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to FeedbackController)
     */
    _config: {},

    options: function (req, res) {
        if (req.method === 'GET') {
            FeedbackOption.find().exec(function (err, feedbackOption) {
                if (err) return res.json({'error': err});
                if (!feedbackOption) return res.json({'error': "No feedback option exists!"});

                return res.json(feedbackOption);
            });
        } else {
            sails.log.info("[FeedbackController.options] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /feedback/options, please use GET method."});
        }
    },

    submit: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                page = req.param('page') || 0,
                feedbackOptionId = req.param('feedbackOptionId') || 0,
                room = _getRoom(req, res),
                hostRoom = room + '-host';

            Feedback.findOne({'sessionId': sessionId, 'page': page}).where({'feedbackOptionId': feedbackOptionId})
                .exec(function (err, feedback) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': err});
                    }

                    if (feedback) {
                        feedback.count = feedback.count + 1;
                        feedback.save(function (err) {
                            if (err) {
                                sails.log.warn(err);
                                return res.json({'error': err});
                            }
                            sails.log.info("New Feedback received:", feedback);

                            var participantNumber = _getParticipantNumber(room);
                            feedback.percentage = feedback.count / participantNumber;

                            sails.io.sockets.in(hostRoom).emit('feedbackReceive', feedback);

                            return res.json(feedback);
                        });
                    } else {
                        var fb = {
                            'sessionId': sessionId,
                            'page': page,
                            'feedbackOptionId': feedbackOptionId,
                            'count': 1
                        };
                        Feedback.create(fb).done(function (err, newFeedback) {
                            // Error handling
                            if (err) {
                                sails.log.warn(err);
                                return res.json({'error': "cannot create feedback"});
                            }

                            var participantNumber = _getParticipantNumber(room);
                            newFeedback.percentage = newFeedback.count / participantNumber;

                            sails.io.sockets.in(hostRoom).emit('feedbackReceive', newFeedback);

                            sails.log.info("Feedback created:", newFeedback);
                            return res.json(newFeedback);
                        });
                    }
                });
        } else {
            sails.log.info("[FeedbackController.submit] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /feedback/submit, please use POST method."});
        }
    },
    
    getInfo: function (req, res) {
        if (req.method === 'GET') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                page = req.param('page') || 0;

            Feedback.find({'sessionId': sessionId, 'page': page}).exec(function (err, feedback) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': err});
                    }
                    if (feedback.length == 0) return res.json({'error': "No feedback exists!"});
                    
                    return res.json(feedback);
                });
        } else {
            sails.log.info("[FeedbackController.submit] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /feedback/submit, please use POST method."});
        }
    }
}
;

function _getParticipantNumber(room) {
    var hostRoom = room + '-host',
        hostNumber = sails.io.sockets.clients(hostRoom).length,
        participantNumber = sails.io.sockets.clients(room).length - hostNumber;
    console.log(room + ":" + participantNumber + ", " + hostRoom + ":" + hostNumber);

    return participantNumber;
}

function _getRoom(req, res) {
    var room = req.session.sKeyPhase || req.param('session');

    if (!room) {
        return res.json({'error':'cannot find session'});
    }

    return room;
}
