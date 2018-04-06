/**
 * QuizController
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
var platform = require('platform');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to QuizController)
     */
    _config: {},

    list: function (req, res) {
        if (req.method === 'GET') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                page = req.param('page') || 0;

            Quiz.find({'sessionId': sessionId}).exec(function (err, quiz) {
                if (err) return res.json({'error': err});

                return res.json(quiz);
            });
        } else {
            sails.log.info("[QuizController.list] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /quiz/list, please use GET method."});
        }
    },

    start: function (req, res) {
        if (req.method === 'POST') {
            var quizId = req.param('quizId') || 0,
				timer = req.param('timer'),
                room = _getRoom(req, res);

            Quiz.findOne({'id': quizId}).exec(function (err, quiz) {
                if (err) return res.json({'error': err});
                if (!quiz) return res.json({'error': "No quiz with that id exists!"});
				console.log("timer: " + timer);
                sails.io.sockets.in(room).emit('quizStart', {'quiz': quiz, 'timer': timer * 60 * 1000});
                return res.json(quiz);
            });
        } else {
            sails.log.info("[QuizController.start] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /quiz/start, please use POST method."});
        }
    },

    stop: function (req, res) {
        if (req.method === 'POST') {
            var quizId = req.param('quizId') || 0,
                room = _getRoom(req, res);

            Quiz.findOne({'id': quizId}).exec(function (err, quiz) {
                if (err) return res.json({'error': err});
                if (!quiz) return res.json({'error': "No quiz with that id exists!"});

                sails.io.sockets.in(room).emit('quizStop', {'id': quizId, 'options': quiz.options});
                return res.json(quiz);
            });
        } else {
            sails.log.info("[QuizController.stop] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /quiz/stop, please use POST method."});
        }
    },

    submit: function (req, res) {
        if (req.method === 'POST') {
            var userId = req.param('userId') || req.session.userId || 0,
                quizId = req.param('quizId') || 0,
                answer = req.param('answer') || '',
                room = _getRoom(req, res),
                hostRoom = room + '-host';

            if (quizId == 0) {
                return res.json({'error': 'a quiz id should be given'});
            }
            if (answer == '') {
                return res.json({'message': 'answer is empty'});
            }

            var quizAnswer = {
                'userId': userId,
                'quizId': quizId,
                'answer': answer
            };

            QuizAnswer.create(quizAnswer).done(function (err, quizA) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create quiz answer"});
                }

                sails.io.sockets.in(hostRoom).emit('quizSubmit', quizA);
                sails.log.info("New quiz answer created:", quizA);
                return res.json(quizA);
            });

        } else {
            sails.log.info("[QuizController.submit] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /quiz/submit, please use POST method."});
        }
    },

    gettags: function (req, res) {
        if (req.method === 'GET') {
            var quizId = req.param('quizId') || 0,
                blacklist = sails.config.CONSTANT.FILTER_WORDS;

            var keywords = {},
                tags = {'tags': []},
                sorted_keywords = [];

            QuizAnswer.find({'quizId': quizId}).exec(function (err, quiz) {
                if (err) return res.json({'error': err});

                for (var i = 0; i < quiz.length; i++) {
                    var k = quiz[i].answer.toLowerCase().split(' ');
                    for (var j = 0; j < k.length; j++) {
                        var w = k[j];
                        if (blacklist.indexOf(w) == -1) {
                            if (w in keywords) {
                                keywords[w] += 1;
                            } else {
                                keywords[w] = 1;
                            }
                        }
                    }
                }

                for (var key in keywords) {
                    sorted_keywords.push(key);
                }
                sorted_keywords.sort();

                for (var i = 0; i < sorted_keywords.length; i++) {
                    var key = sorted_keywords[i],
                        tag = {'tag': key, 'freq': keywords[key]};
                    tags.tags.push(tag);
                }

                return res.json(tags);
            });
        } else {
            sails.log.info("[QuizController.gettags] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /quiz/gettags, please use GET method."});
        }
    },

    delete: function (req, res) {
        if (req.method === 'POST') {
            var quizId = req.param('quizId') || 0;
            Quiz.destroy({'id': quizId}).done(function (err) {
                if (err) {
                    return console.log(err);
                } else {
                    console.log("Quiz " + quizId + " deleted");
                }
            });
            QuizAnswer.destroy({'quizId': quizId}).done(function (err) {
                if (err) {
                    return console.log(err);
                } else {
                    console.log("Quiz " + quizId + " deleted");
                }
            });
        } else {
            sails.log.info("[UserController.find] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /comment/find, please use GET method."});
        }
    },

    add: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                page = req.param('page'),
                question = req.param('question'),
                options = req.param('options'),
                keyword = req.param('keyword'),
                fileId = req.param('fileId'),
                room = _getRoom(req, res),
                hostRoom = room + '-host';

            if (sessionId == 0) {
                return res.json({'error': 'a session id should be given'});
            }
            if (question == '') {
                return res.json({'message': 'question is empty'});
            }

            var quiz = {
                'sessionId': sessionId,
                'page': page,
                'question': question,
                'options': options,
                'keyword': keyword,
                'fileId': fileId
            };
//			console.log(quiz);
            Quiz.create(quiz).done(function (err, quizA) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create quiz answer"});
                }

//                sails.io.sockets.in(hostRoom).emit('quizAdd', quizA);
//                sails.log.info("New quiz created:", quizA);
                return res.json(quizA);
            });

        } else {
            sails.log.info("[QuizController.add] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /quiz/add, please use POST method."});
        }
    },

    update: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                page = req.param('page'),
                question = req.param('question'),
                options = req.param('options'),
                keyword = req.param('keyword'),
                fileId = req.param('fileId'),
                quizId = req.param('quizId') ? parseInt(req.param('quizId')) : 0;

            if (sessionId == 0) {
                return res.json({'error': 'a session id should be given'});
            }
            if (question == '') {
                return res.json({'message': 'question is empty'});
            }

            var quiz = {
                'id': quizId,
                'sessionId': sessionId,
                'page': page,
                'question': question,
                'options': options,
                'keyword': keyword,
                'fileId': fileId
            };

            Quiz.update({'id': quizId}, quiz, function (err, quizA) {
                console.log(quizA);
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create quiz answer"});
                }
                return res.json(quizA);
            });

        } else {
            sails.log.info("[QuizController.add] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /quiz/update, please use POST method."});
        }
    },
	
	find: function(req, res) {
		if (req.method === 'GET') {
			var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
				quizId = req.param('quizId') || 0;

            if (quizId == '') {
                return res.json({'message': 'quizId is empty'});
            }
			
            Quiz.findOne({'id': quizId}).exec(function (err, quiz) {
                if (err) return res.json({'error': err});
                if (!quiz) return res.json({'error': "No quiz with that id exists!"});

                return res.json(quiz);
            });	
        } else {
            sails.log.info("[QuizController.find] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /quiz/find, please use GET method."});
        }
	},

    getsessionlist: function (req, res) {
        if (req.method === 'GET') {
            var userId = req.param('userId') || req.session.sUserId || 0;

			if (userId == 0 || userId == '0') {
                return res.json({'error': 'a user id should be given'});
            }            
			
			Session.find({'creatorId': userId}).exec(function (err, sessionList) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "error occurred when trying to get quiz session list"});
                }

                var sessionId = [];
                for (var i = 0; i < sessionList.length; i++) {
                    sessionId.push(sessionList[i].id);
                }

                Quiz.find({'sessionId': sessionId}).exec(function (err, quizList) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': "error occurred when trying to get quiz session list"});
                    }

                    if (quizList.length == 0) return res.json({'message': "no session contained quiz found"});

                    var quizSession = [];
                    for (var i = 0; i < quizList.length; i++) {
                        var quiz = quizList[i],
                            sId = quiz.sessionId;

                        if (quizSession.indexOf(sId) == -1) {
                            quizSession.push(sId);
                        }
                    }

                    Session.find({'id': quizSession}).exec(function (err, returnSessionList) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'err': "error occurred when trying to get quiz session list"});
                        }

                        return res.json(returnSessionList);
                    });
                });
            });
        } else {
            sails.log.info("[QuizController.getsessionlist] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /quiz/getsessionlist, please use GET method."});
        }
    },

    getfilelist: function (req, res) {
        if (req.method === 'GET') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0;

            Quiz.find({'sessionId': sessionId}).exec(function (err, quizList) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "error occurred when trying to get quiz file list"});
                }

                if (quizList.length > 0) {
                    var quizFiles = [];
                    for (var i = 0; i < quizList.length; i++) {
                        var quiz = quizList[i],
                            fileId = quiz.fileId;

                        if (quizFiles.indexOf(fileId) == -1) {
                            quizFiles.push(fileId);
                        }
                    }

                    File.find({'id': quizFiles}).exec(function (err, fileList) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "error occurred when trying to get quiz file list"});
                        }

                        return res.json(fileList);
                    });
                } else {
                    return res.json({'message': "no quiz file found"});
                }
            });
        } else {
            sails.log.info("[QuizController.getfilelist] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /quiz/getfilelist, please use GET method."});
        }
    },

    export: function (req, res) {
        if (req.method === 'GET') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                fileId = req.param('fileId') || 0;

            if (!fileId) return res.json({'message': "invalid fileId"});

            Quiz.find({'sessionId': sessionId, 'fileId': fileId}).exec(function (err, quizList) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "error occurred when trying to export quiz"});
                }

                if (quizList.length == 0) {
                    return res.json({'message': "no quiz for this file found"});
                }

                return res.json({'quiz': quizList});
            });
        } else {
            sails.log.info("[QuizController.export] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /quiz/export, please use GET method."});
        }
    }
};

function _getRoom(req, res) {
    var room = req.session.sKeyPhase || req.param('session');

    if (!room) {
        return res.json({'error': 'cannot find session'});
    }

    return room;
}

function _windowsSystemCheck(agent) {
    var ua = platform.parse(agent);
    return (ua.os ? ("" + ua.os).toLowerCase().indexOf("win") != -1 : false);
}