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
var fs = require('fs'),
    crypto = require('crypto'),
    platform = require('platform');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to QuizController)
     */
    _config: {},
	
	find: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.session.sSessionId || req.param('sessionId') || 0,
                room = _getRoom(req, res);

            Evaluation.find({'sessionId': sessionId}).exec(function (err, evaluation) {
                if (err) return res.json({'error': err});
                if (evaluation.length == 0) return res.json({'error': "No evaluation with that sessionId exists!"});

                return res.json(evaluation);
            });
        } else {
            sails.log.info("[EvaluationController.find] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /evaluation/find, please use POST method."});
        }		
	},

    start: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.session.sSessionId || req.param('sessionId') || 0,
                room = _getRoom(req, res);

			Evaluation.find({'sessionId': sessionId}).exec(function (err, evaluation) {
                if (err) return res.json({'error': err});
                if (evaluation.length == 0) return res.json({'error': "No evaluation with that sessionId exists!"});

                sails.io.sockets.in(room).emit('evaluationStart', evaluation);
                return res.json(evaluation);
            });
        } else {
            sails.log.info("[EvaluationController.start] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /evaluation/start, please use POST method."});
        }
    },
	
	submit: function (req, res) {
		if (req.method === 'POST') {
            var userId = req.param('userId') || req.session.userId || 0,
                evaluationId = req.param('evaluationId') || 0,
                feedback = req.param('feedback') || '',
                room = _getRoom(req, res),
                hostRoom = room + '-host';
			
            if (evaluationId == 0) {
                return res.json({'error': 'a quiz id should be given'});
            }
            if (feedback == '') {
                return res.json({'message': 'feedback is empty'});
            }

            var evaluationAnswer = {
                'userId': userId,
                'evaluationId': evaluationId,
                'feedback': feedback
            };

            EvaluationAnswer.create(evaluationAnswer).done(function (err, evaluationA) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create evaluation answer"});
                }

                sails.log.info("New evaluation answer created:", evaluationA);
                return res.json(evaluationA);
            });	
				
		} else {
            sails.log.info("[EvaluationController.submit] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /evaluation/submit, please use POST method."});
        }
	},
	
	getData: function (req, res) {
        var sessionId = req.session.sSessionId || req.param("sessionId") || 0,
            keyPhase = req.session.sKeyPhase || req.param('session') || "",
            userId = req.session.sUserId || req.param('userId') || 0;
		
		var Obj = {},
			content = [],
			m = 0;

		_findEvaluationObject(sessionId, function (err, evaluation) {
			console.log("evaluaton.length: " +  evaluation.length);
			if (evaluation.length == 0) {
				return res.json({'result': 'There is no evaluation.'});
			} else {
				var stat = evaluation;
				for (var key in stat) {
					if (key == "question") {
						content.push(stat[key]);
						content.push(" ");
					} else {	
						for (var key1 in stat[key]) {
							content.push(key1 + " : " + stat[key][key1]);
							content.push(" ");						
						}
					}
				}
				
				m++;				

				if (m == evaluation.length) {
					_exportTxt(sessionId, userId, keyPhase, content, _windowsSystemCheck(req.headers['user-agent']) ? "\r\n" : "\n"); 
					return res.json({'result': "success"});
				}
			}
		});
		
    },
    
    delete: function (req, res) {
        if (req.method === 'POST') {
            var evaluationId = req.param('evaluationId') || 0;
            Evaluation.destroy({'id': evaluationId}).done(function (err) {
                if (err) {
                    return console.log(err);
                } else {
                    console.log("Evaluation " + evaluationId + " deleted");
                }
            });
            EvaluationAnswer.destroy({'evaluationId': evaluationId}).done(function (err) {
                if (err) {
                    return console.log(err);
                } else {
                    console.log("Evaluation " + evaluationId + " deleted");
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
                question = req.param('question'),
                options = req.param('options'),
                room = _getRoom(req, res),
                hostRoom = room + '-host';

            if (sessionId == 0) {
                return res.json({'error': 'a session id should be given'});
            }
            if (question == '') {
                return res.json({'message': 'question is empty'});
            }

            var evaluation = {
                'sessionId': sessionId,
                'question': question,
                'options': options
            };

            Evaluation.create(evaluation).done(function (err, evaluationA) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create evaluation answer"});
                }

                return res.json(evaluationA);
            });

        } else {
            sails.log.info("[EvaluationController.add] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /evaluation/add, please use POST method."});
        }
    },

    update: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                question = req.param('question'),
                options = req.param('options'),
                evaluationId = req.param('evaluationId') ? parseInt(req.param('evaluationId')) : 0;

            if (sessionId == 0) {
                return res.json({'error': 'a session id should be given'});
            }
            if (question == '') {
                return res.json({'message': 'question is empty'});
            }

            var evaluation = {
                'id': evaluationId,
                'sessionId': sessionId,
                'question': question,
                'options': options
            };

            Evaluation.update({'id': evaluationId}, evaluation, function (err, evaluationA) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create quiz answer"});
                }
                return res.json(evaluationA);
            });

        } else {
            sails.log.info("[EvaluationController.add] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /evaluation/add, please use POST method."});
        }
    }    
};

function _exportTxt(sessionId, userId, keyPhase, stat, newlineChar) {
    var filePath = sails.config.CONSTANT.UPLOAD_PATH + sails.config.CONSTANT.SEPERATOR + keyPhase + sails.config.CONSTANT.SEPERATOR + "Evaluation_Result.txt";
	
    fs.appendFile(filePath, stat.join(newlineChar), function (err) {
        if (err) {
            sails.log.warn('exec error: ' + err);
        }

        _generateHash({'path': filePath}, function (err, hash) {
            if (err) {
                sails.log.error(err);
            } else {
                fs.readFile(filePath, function (err, data) {
                    if (err) {
                        sails.log.error(err);
                    } else {
                        var now = new Date(),
                            stats = fs.statSync(filePath),
                            statFileName = ["evaluation", now.getFullYear(), ("0" + (now.getMonth() + 1)).slice(-2),
                                ("0" + now.getDate()).slice(-2), keyPhase, hash.md5].join("-") + ".txt";

                        S3Service.put({
                            Key: statFileName,
                            Body: data,
                            ContentMD5: hash.base64,
                            ContentLength: stats["size"],
                            ContentType: 'text/plain'
                        }, function (err, result) {
                            if (err) {
                                console.log("Error uploading data: ", err);
                            } else {
                                File.create({
                                    'sessionId': sessionId,
                                    'userId': userId,
                                    'name': statFileName,
                                    'location': sails.config.CONSTANT.S3_BUCKET + '.s3.amazonaws.com/' + statFileName,
                                    'size': stats["size"],
                                    'type': 'text'
                                }).done(function (err, newFile) {
                                    fs.unlink(filePath, function (err) {
                                        if (err) sails.log.error(err);
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    });
} 

function _findEvaluationObject(sessionId, cb) {
    Quiz.find({'sessionId': sessionId, "page": 9999}).exec(function (err, evaluation) {
		if (err) {
            cb(err);
        } else {
			var evaluationResult = {};
			if (evaluation.length > 0) {
				for (var i=0; i<evaluation.length; i++) {
					var question = JSON.parse(evaluation[i].question);
					_findEvaluationAnswer({"id": evaluation[i].id, "question" : question.question, "length" : evaluation.length}, function(err, evaluationAnswer){
						
						evaluationResult["question"] = evaluationAnswer["question"];
						evaluationResult["answer"] = evaluationAnswer["answer"];
						evaluationResult["length"] = evaluationAnswer["length"];
						cb(null, evaluationResult);
					});
				}
            } else {
				evaluationResult["length"] = 0;
                cb(null, evaluationResult);
            }
        }
    });
}

function _findEvaluationAnswer(evaluation, cb){
	EvaluationAnswer.find({"evaluationId": evaluation.id}).exec(function (err, evaluationAnswer) {
		if (err) {
			cb(err);
		} else {
			if (evaluationAnswer.length == 0) {
				cb(null, {"question": '', "answer": '', "length": 0});
			} else {
				var answerFrequency = {};
				
				for (var i=0; i<evaluationAnswer.length; i++) {
					var key = evaluationAnswer[i].feedback;
					if (answerFrequency[key]) {
						answerFrequency[key]++;
					} else {
						answerFrequency[key] = 1;
					}
				}
				cb(null, {"question":evaluation.question, "answer":answerFrequency, "length": evaluation.length});
			}
		}
	});
}

function _isObjectEmpty(obj) {
    return Object.getOwnPropertyNames(obj).length == 0;
}

function _generateHash(options, cb) {
    fs.readFile(options.path, function (err, data) {
        if (err) {
            return cb(err);
        } else {
            var base64 = crypto.createHash('md5').update(data).digest("base64"),
                md5hash = crypto.createHash('md5').update(data).digest("hex"),
                sha256hash = crypto.createHash('sha256').update(data).digest("hex");

            return cb(null, {'base64': base64, 'md5': md5hash, 'sha256': sha256hash});
        }
    });
}


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