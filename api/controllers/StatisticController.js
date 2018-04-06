/**
 * StatisticController
 *
 * @description :: Server-side logic for managing Statistics
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var fs = require('fs'),
    crypto = require('crypto'),
    platform = require('platform');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to StatisticController)
     */
    _config: {},

    find: function (req, res) {
        var sessionId = req.session.sSessionId || req.param("sessionId") || 0;
        _findStatisticObject(sessionId, function (err, statistic) {
            if (err) {
                sails.log.error("<StatisticController.find> " + err);
                res.json({'error': "error occurred when finding statistic"});
            } else {
					var	content = [];
						statisticStat={},
						statisticStatTime={},
						statisticStatComment={},
						statisticStatFeedback={};
					
					statisticStat = JSON.parse(statistic.content);
					statisticStatTime = statisticStat.time;
					statisticStatComment = statisticStat.comment;
					statisticStatFeedback = statisticStat.feedback;
					console.log(statisticStat);
					console.log(statisticStatTime);
					console.log(statisticStatComment);
					console.log(statisticStatFeedback);

					for (var key in statisticStat) {
						if (key == "time") {
							content.push(key + ": \r\n")
							for (var keyTime in statisticStatTime) {
								content.push(keyTime + ": " + statisticStatTime[keyTime] + "\r\n");
							}
							content.push("\r\n");
						} else if (key == "comment") {
							content.push(key + ": \r\n")
							for (var keyComment in statisticStatComment) {
								content.push("Page " + keyComment + ": " + statisticStatComment[keyComment] + "\r\n");
							}
							content.push("\r\n");
						} else if (key == "feedback") {
							content.push(key + ": \r\n")
							for (var keyFeedback in statisticStatFeedback) {
								content.push("Page " + keyFeedback + "\r\n");
								var sf = statisticStatFeedback[keyFeedback];
								for (var keyFeedbackOptions in sf) {
									content.push(keyFeedbackOptions + ": " + sf[keyFeedbackOptions] + "\r\n");
								}
							}
							content.push("\r\n");
						} else {				
							content.push(key + ": " + statisticStat[key] + "\r\n");
							content.push("\r\n");
						}
					}
					res.json(content);
            }
        });
    },

    save: function (req, res) {
        var sessionId = req.session.sSessionId || req.param("sessionId") || 0;

        _getOrCreateStatisticObject(sessionId, function (err, statistic) {
            if (err) {
                sails.log.error("<StatisticController.save> " + err);
                res.json({'error': "cannot save current statistic"});
            } else {
                var stat = req.param("stat");
                try {
                    var oldStat = JSON.parse(statistic.content),
                        newStat = stat;

                    for (var key in newStat) {
                        oldStat[key] = newStat[key];
                    }

                    statistic.content = JSON.stringify(oldStat);
                    statistic.save(function (err) {
                        if (err) {
                            sails.log.error("<StatisticController.save> " + err);
                            return res.json({'error': "cannot save current statistic"});
                        }
                        return res.json({'result': "success"});
                    });
                } catch (e) {
                    sails.log.error("<StatisticController.save> " + e);
                    return res.json({'error': "cannot save current statistic"});
                }
            }
        });
    },
	
	getData: function (req, res) {
        var sessionId = req.session.sSessionId || req.param("sessionId") || 0,
            keyPhase = req.session.sKeyPhase || req.param('session') || "",
            userId = req.session.sUserId || req.param('userId') || 0;
		
		var Obj = {},
			kinds = 0;
			
		_getStatistics(sessionId, function(err, kind, cbObj){
			if (err) {
				cb(err);
			} else {
				switch (kind) {
					case "comment":
						Obj["comment"] = cbObj;
						break;
					case "feedback":
						Obj["feedback"] = cbObj;
						break;
					case "quiz":
						Obj["quiz"] = cbObj;
						break;
					case "time":	
						Obj["time"] = cbObj;
						break;
					case "participant":
						Obj["participant"] = cbObj;
						break;
					default:
						res.json({'msg': 'No data'});
				}

				kinds++;
				
				if (kinds == 5) {
					_getOrCreateStatisticObject(sessionId, function (err, statistic) {
						//try {
							var oldStat = JSON.parse(statistic.content),
								newStat = Obj;
								newStat["slidesNum"] = req.session.sSlidesInfo.pages;

							for (var key in newStat) {
								oldStat[key] = newStat[key];
							}
							
							console.log("oldStat:" + JSON.stringify(oldStat));
							
                            _exportTxt(sessionId, userId, keyPhase, oldStat, _windowsSystemCheck(req.headers['user-agent']) ? "\r\n" : "\n");

							Statistic.update({"sessionId": sessionId}, {"content": JSON.stringify(oldStat)}).exec(function (err) {
								if (err) {
									sails.log.error("<StatisticController.save> " + err);
									return res.json({'error': "cannot save current statistic"});
								}
								return res.json({'result': "success"});
							});
						//} catch (e) {
						//	sails.log.error("<StatisticController.save> " + e);
						//	return res.json({'error': "cannot save current statistic"});
						//}	
					});			
				}
			}
		});	
    }
};

function _exportTxt(sessionId, userId, keyPhase, stat, newlineChar) {
    var filePath = sails.config.CONSTANT.UPLOAD_PATH + sails.config.CONSTANT.SEPERATOR + keyPhase + sails.config.CONSTANT.SEPERATOR + "statistic.txt",
		content = [],
		statisticStat={},
		statisticStatTime={},
		statisticStatComment={},
		statisticStatFeedback={};
	
	statisticStat = stat;
	statisticStatTime = statisticStat.time;
	statisticStatComment = statisticStat.comment;
	statisticStatFeedback = statisticStat.feedback;

	for (var key in statisticStat) {
		if (key == "time") {
			content.push(key + ": ")
			for (var keyTime in statisticStatTime) {
				content.push(keyTime + ": " + statisticStatTime[keyTime]);
			}
			content.push(" ");
		} else if (key == "comment") {
			content.push(key + ": ")
			for (var keyComment in statisticStatComment) {
				content.push("Page " + keyComment + ": " + statisticStatComment[keyComment]);
			}
			content.push(" ");
		} else if (key == "feedback") {
			content.push(key + ": ")
			for (var keyFeedback in statisticStatFeedback) {
				content.push("Page " + keyFeedback);
				var sf = statisticStatFeedback[keyFeedback];
				for (var keyFeedbackOptions in sf) {
					content.push(keyFeedbackOptions + ": " + sf[keyFeedbackOptions]);
				}
			}
			content.push(" ");
		} else {				
			content.push(key + ": " + statisticStat[key]);
			content.push(" ");
		}
	}

    fs.appendFile(filePath, content.join(newlineChar), function (err) {
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
                            statFileName = ["statistic", now.getFullYear(), ("0" + (now.getMonth() + 1)).slice(-2),
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
                                    'type': 'txt'
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


function _findStatisticObject(sessionId, cb) {
    Statistic.findOne({'sessionId': sessionId}).exec(function (err, statistic) {
        if (err) {
            cb(err);
        } else {
            if (statistic) {
                cb(null, statistic);
            } else {
                cb(null, {});
            }
        }
    });
}

function _getOrCreateStatisticObject(sessionId, cb) {
    _findStatisticObject(sessionId, function (err, statistic) {
        if (err) {
            cb(err);
        } else {
            if (_isObjectEmpty(statistic)) {
                Statistic.create({'sessionId': sessionId, 'content': "{}"}).exec(function (error, stat) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, stat);
                    }
                });
            } else {
                cb(null, statistic);
            }
        }
    });
}

function _isObjectEmpty(obj) {
    return Object.getOwnPropertyNames(obj).length == 0;
}

function _getStatistics(sessionId, cb) {
	Comment.find({'sessionId': sessionId}).exec(function (err, comment) { 
		var commentObj = {};

		for (var i=0; i<comment.length; i++) {		
			if (comment[i].page in commentObj) {
				commentObj[comment[i].page] += 1;
			} else {
				commentObj[comment[i].page] = 1;
			}
		}
		
		cb(err, "comment" ,commentObj);
	});
	
	Feedback.find({'sessionId': sessionId}).exec(function (err, feedback) { 
		var feedbackObj = {};
		
		for (var i=0; i<feedback.length; i++) {
			if (feedback[i].page in feedbackObj) {
				if (feedback[i].feedbackOptionId == 1) {
					feedbackObj[feedback[i].page]["Understandability"] = feedback[i].count;
				} else {
					feedbackObj[feedback[i].page]["Speed"] = feedback[i].count;
				}
			} else {
				feedbackObj[feedback[i].page] = {};
				if (feedback[i].feedbackOptionId == 1) {
					feedbackObj[feedback[i].page]["Understandability"] = feedback[i].count;
				} else {
					feedbackObj[feedback[i].page]["Speed"] = feedback[i].count;
				}					
			}	
		}
		
		cb(err, "feedback" ,feedbackObj);
	});
	
	Quiz.find({"sessionId": sessionId}).exec(function(err, quiz) {
		var quizNum = 0,
			currentQuiz = 0;
		
		if (quiz.length == 0) {
			cb(err, "quiz" ,quizNum);
		} else {
			for (var i=0; i<quiz.length; i++){
				getQuizAnswer(quiz[i].id, function(err, num){
					quizNum += num;
					currentQuiz++;
					if (currentQuiz == quiz.length){
						cb(err, "quiz" ,quizNum);
						console.log("quiz cb;");
					}				
				});
			}
		}		
	});
	
	Session.findOne({"id": sessionId}).exec(function(err, session) {
		var time = {},
			startTime,
			endTime;
		time["startedAt"] = session.startedAt;
		
		startTime = new Date(session.startedAt);
		startTime = startTime.getTime();
		endTime = new Date(session.endedAt);
		endTime = endTime.getTime();
		
		if (session.endedAt) {
			time["endedAt"] = session.endedAt;
			
			var hour = Math.floor((endTime - startTime) / 3600000),
				min = Math.floor((endTime - startTime) / 60000) - hour * 60,
				sec = Math.floor((endTime - startTime) / 1000) - hour * 3600 - min * 60,
				duration;
			duration = hour + " hour " + (hour > 1 ? 's' : '') + min + " min " + (min > 1 ? 's' : '') + sec + " sec " + (sec > 1 ? 's' : '');
		//	time["duration"] = duration;
		}
		
		cb(err, "time", time);
		cb(err, "participant", session.participant);
	});
}

function getQuizAnswer(quizId, cb) {
	QuizAnswer.find({"quizId": quizId}).exec(function(err, quizAnswer) {
		var num = 0;
		
		if (quizAnswer.length == 0) {
			
		} else {
			num = 1;	
		}
		cb(err, num);
	});	
}

function _windowsSystemCheck(agent) {
    var ua = platform.parse(agent);
    return (ua.os ? ("" + ua.os).toLowerCase().indexOf("win") != -1 : false);
}