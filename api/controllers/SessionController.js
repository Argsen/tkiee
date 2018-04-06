/**
 * SessionController
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
    https = require('https'),
    mkdirp = require('mkdirp'),
    csv = require('csv-parser'),
    crypto = require('crypto'),
    glossary = require("glossary"),
    pluralize = require('pluralize'),
    pngquant = require('pngquant'),
    _isProcessingPdf = false,
    _isProcessingOffice = false;

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to SessionController)
     */
    _config: {},

    list: function (req, res) {
        if (req.method === 'GET') {
            Session.find({or: [
                {status: 1},
                {status: 2},
                {status: 3},
                {status: 4}
            ]}).exec(function (err, session) {
                if (err) return res.json({'error': err});
                if (!session) return res.json({'error': "No session with that id exists!"});
                
                return res.json(session);
            });
        } else {
            sails.log.info("[SessionController.list] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /session/list, please use GET method."});
        }
    },
    
    listParticipated: function (req, res) {
        if (req.method === 'GET') {
            var userId = req.param('userId') || req.session.sUserId || 0,
                paSession = [];
            
            UserSession.find({"userId": userId}).exec(function (err, Obj) {
                if (err) return res.json({'error': err});
                if (!Obj) return res.json({'error': "Cannot find in usersession!"});
                
                var n = 0;
                for (var i=0; i<Obj.length; i++) {
                    Session.findOne(Obj[i].sessionId).exec(function (err, sessionObj) {
                        if (err) return res.json({'error': err});
                        if (!sessionObj){
                        
                        } else {
                            paSession.push(sessionObj);
                        }
                        n++;
                        if (n == Obj.length) {
                            return res.json(paSession);
                        }
                    });                 
                } 
            });
        } else {
            sails.log.info("[SessionController.listParticipated] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /session/listParticipated, please use GET method."});
        }
    },

    listzip: function (req, res) {
        if (req.method === 'GET') {
            var sessionId = req.param('sessionId');

            if (sessionId == 0) {
                return res.json({'error': 'a session id should be given'});
            }

            File.find({'sessionId': sessionId, or: [
                {"type": "zip"},
                {"type": "txt"},
                {"type": "text"}
            ]}).exec(function (err, files) {
                if (err) return res.json({'error': err});
                if (!files) return res.json({'error': "Cannot find zip file for this session!"});

                return res.json(files);
            });
        } else {
            sails.log.info("[SessionController.listzip] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /session/listzip, please use GET method."});
        }
    },

    new: function (req, res) {
        if (req.method === 'POST') {
            if (req.session.sSessionId) {
                res.json({'error': "There is a previous session found. If you want create a new session, please close and open your browser."});
            } else {
                _generateKeyPhaseAndCreateSession(req, res);
            }
        } else {
            sails.log.info("[SessionController.new] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /session/new, please use POST method."});
        }
    },

    changestatus: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId;
            var role = req.session.sRole;
            var status = req.param('status');
            if (sessionId && role === 'host' && status) {
                Session.findOne(sessionId).exec(function (err, session) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': 'could not find session'});
                    }

                    if (status == 2) {
                        var keyPhase = req.session.sKeyPhase;

                        if (keyPhase) {
                            _getFileListFromDb({'sessionId': session.id}, function (err, data) {
                                if (err) {
                                    return res.json({'error': err});
                                }
                                req.session.sSlidesInfo = data;

                                session.status = status;
                                session.startedAt = _getUTCTime();
                                session.save(function (err) {
                                    if (err) {
                                        sails.log.warn(err);
                                        return res.json({'error': 'could not change session status'});
                                    }
                                    console.log("change session status to " + status);
                                    return res.json({'result': 'success'});
                                });
                            });
                        } else {
                            return res.json({'error': 'could not find proper keyPhase'});
                        }
                    } else if (status == 3) {
                        Session.update(sessionId, {'status': status, "endedAt": _getUTCTime()}).exec(function (err) {
                            if (err) {
                                sails.log.warn(err);
                                return res.json({'error': 'could not change session status'});
                            }
                            console.log("change session status to " + status);
                            return res.json({'result': 'success'});
                        });
                    } else {
                        Session.update(sessionId, {'status': status}).exec(function (err) {
                            if (err) {
                                sails.log.warn(err);
                                return res.json({'error': 'could not change session status'});
                            }
                            console.log("change session status to " + status);
                            return res.json({'result': 'success'});
                        });
                    }
                });
            }
        } else {
            sails.log.info("[SessionController.changestatus] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /session/changestatus, please use POST method."});
        }
    },

    changepending: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId;
            var status = req.param('status');

            if (sessionId) {
                Session.update(sessionId, {'status': status}).exec(function (err) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': 'could not change session status'});
                    }
                    console.log("change session status to " + status);
                    return res.json({'result': 'success'});
                });
            }
        } else {
            sails.log.info("[SessionController.changestatus] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /session/changestatus, please use POST method."});
        }
    },

    join: function (req, res) {
        if (req.method === 'POST') {
            var keyPhase = req.param('keyPhase'),
                password = req.param('password'),
                orient = req.param('orient'),
                userId = req.param('userId');

            console.log('keyPhase: ' + keyPhase + ', password: ' + password);
            if (!keyPhase) return res.json({'error': 'please provide session keyphase'});

            keyPhase = keyPhase.toUpperCase();
            if (orient == "dashboard") {
                Session.findOne({'keyPhase': keyPhase, or: [{'status': 2}, {"status": 3}, {"status": 4}]}).exec(function (err, session) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': 'could not access requested session'});
                    }
                    
                    if (session) {
                        req.session.sSessionId = session.id;
                        req.session.sSessionName = session.name;
                        req.session.sKeyPhase = keyPhase;
                        req.session.sRole = 'participant';
                        if (session.creatorId == userId) {
                            req.session.sRole = 'host';
                            req.session.sPage = 0;
                        }
                        var isMobile = isCallerMobile(req);
                        session.isMobile = isMobile;
                        session.role = req.session.sRole;
                        delete session.password;

                        _getFileListFromDb({'sessionId': session.id}, function (err, data) {
                            if (err) {
                                return res.json({'error': err});
                            }
                            req.session.sSlidesInfo = data;
                            //	console.log(session);
                            return res.json(session);
                        });
                    } else {
                        return res.json({'error': 'cannot find session'});
                    }
                });
            } else {
                Session.findOne({'keyPhase': keyPhase, or: [{'status': 1}, {"status": 2}]}).exec(function (err, session) {
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': 'could not access requested session'});
                    }

                    if (session) {
                        if (password && password !== session.password) {
                            if (session.creatorId != 0) {
                                User.findOne({'id': session.creatorId}).exec(function (err, user) {
                                    if (err) {
                                        sails.log.warn(err);
                                        return res.json({'error': 'could not access required user'});
                                    }
                                    if (user) {
                                        if (user.password != password) {
                                            return res.json({'error': 'password not match'});
                                        }
                                        req.session.sSessionId = session.id;
                                        req.session.sSessionName = session.name;
                                        req.session.sKeyPhase = keyPhase;
                                        req.session.sRole = 'participant';
                                        if (password && user.validate(password)) {
                                            req.session.sRole = 'host';
                                            req.session.sPage = 0;
                                        }
                                        var isMobile = isCallerMobile(req);
                                        session.isMobile = isMobile;
                                        session.role = req.session.sRole;
                                        delete session.password;

                                        _getFileListFromDb({'sessionId': session.id}, function (err, data) {
                                            if (err) {
                                                return res.json({'error': err});
                                            }
                                            req.session.sSlidesInfo = data;
                                            //	console.log(session);
                                            return res.json(session);
                                        });
                                    }
                                });
                            } else {
                                return res.json({'error': 'password not match'});
                            }
                        } else {
                            req.session.sSessionId = session.id;
                            req.session.sSessionName = session.name;
                            req.session.sKeyPhase = keyPhase;
                            req.session.sRole = 'participant';
                            if (password && password === session.password) {
                                req.session.sRole = 'host';
                                req.session.sPage = 0;
                            }
                            var isMobile = isCallerMobile(req);
                            session.isMobile = isMobile;
                            session.role = req.session.sRole;
                            delete session.password;

                            _getFileListFromDb({'sessionId': session.id}, function (err, data) {
                                if (err) {
                                    return res.json({'error': err});
                                }
                                req.session.sSlidesInfo = data;
                                //	console.log(session);
                                return res.json(session);
                            });
                        }
                    } else {
                        return res.json({'error': 'cannot find session'});
                    }
                });
            }
        } else {
            sails.log.info("[SessionController.join] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /session/join, please use POST method."});
        }
    },

    upload: function (req, res) {
        var file = req.files.sessionFile,
            name = file.name,
            size = file.size,
            tmpPath = file.path,
            keyPhase = req.session.sKeyPhase || '',
            sessionId = req.session.sSessionId || 0,
            userId = req.session.sUserId || 0,
            jobs = sails.config.GLOBAL.JOBS,
			order = req.param('order') || 0;

        if (size > sails.config.CONSTANT.UPLOAD_SIZE) {
            //fs.remove
        }
        if (!keyPhase) {
            return res.json({'error': "please create a session first."}, 403);
        }
        // trick preventing ie9 upload error
        if (typeof tmpPath != "string") return res.json({'error': "upload not supported by your browser"}, 403);

        var filePath = sails.config.CONSTANT.UPLOAD_PATH + sails.config.CONSTANT.SEPERATOR + keyPhase;

        File.findOne({'sessionId': sessionId, 'userId': userId, 'name': name, 'type': "pdf"}).exec(function(err, dbfile) {
            if (err) {
                sails.log.error(err);
                res.json({'message':'error occurred when uploading'}, 500);
            } else if (dbfile) {
                res.json({'message':'file already exists'}, 200);
            } else {
                res.setHeader("Content-Type", "text/plain");
                res.writeHead(200);
                // check filePath
                mkdirp(filePath, function (err) {
                    if (err) {
                        sails.log.warn(err);
                        return res.end('could not write file system');
                    }

                    fs.readFile(tmpPath, function (err, data) {
                        if (err) {
                            sails.log.warn(err);
                            return res.end('could not read file');
                        } else {
                            var p = filePath + sails.config.CONSTANT.SEPERATOR + name;
                            fs.writeFile(p, data, function (err) {
                                if (err) {
                                    sails.log.warn(err);
                                    return res.end('could not write file to storage');
                                } else {
                                    function _processPdfJob() {
                                        jobs.cardByType('convertPdfFile', 'inactive', function (err, n) {
                                            if (err) {
                                                sails.log.warn(err);
                                                _isProcessingPdf = false;
                                            } else {
                                                console.log("<" + n + " pdf files waiting for processing>");
                                                if (n > 0) {
                                                    jobs.process('convertPdfFile', function (job, done) {
                                                        var keepalive = setInterval(function () {
                                                            res.write("-");
                                                        }, 1000);
                                                        _processPDF(job.data, function (err, data) {
                                                            clearInterval(keepalive);
                                                            _updateSessionStatus({'sessionId': sessionId, 'status': 1});
                                                            res.end(">ok");
                                                            if (err) {
                                                                sails.log.warn(err);
                                                                done(err);
                                                            } else {
                                                                req.session.sSlidesInfo = data;
                                                                done(null, data);
                                                            }
                                                        });
                                                    });
                                                    console.log('processing pdf file');
                                                } else {
                                                    _isProcessingPdf = false;
                                                }
                                            }
                                        });
                                    }

                                    function _processOfficeJob() {
                                        jobs.cardByType('convertOfficeFile', 'inactive', function (err, n) {
                                            if (err) {
                                                sails.log.warn(err);
                                                _isProcessingOffice = false;
                                            } else {
                                                console.log("<" + n + " office files waiting for processing>");
                                                if (n > 0) {
                                                    jobs.process('convertOfficeFile', function (job, done) {
                                                        var keepalive = setInterval(function () {
                                                            if (!job.data.bypassPPT) res.write("-");
                                                        }, 1000);
                                                        _processOfficeFile(job.data, function (err, data) {
                                                            clearInterval(keepalive);
                                                            if (!job.data.bypassPPT) {
                                                                _updateSessionStatus({'sessionId': sessionId, 'status': 1});
                                                                res.end(">ok");
                                                            }
                                                            if (err) {
                                                                sails.log.warn(err);
                                                                done(err);
                                                            } else {
                                                                if (!job.data.bypassPPT) req.session.sSlidesInfo = data;
                                                                done(null, data);
                                                            }
                                                        });
                                                    });
                                                    console.log('processing office file');
                                                } else {
                                                    _isProcessingOffice = false;
                                                }
                                            }
                                        });
                                    }

//                            console.log(file.headers["content-type"]);
                                    switch (file.headers["content-type"]) {
                                        case 'application/pdf': //pdf
                                            var options = {
                                                'title': 'converting PDF file <' + p + '>',
                                                'fileName': name,
                                                'filePath': p,
                                                'toPath': filePath,
                                                'tmpPath': filePath + sails.config.CONSTANT.SEPERATOR + 'tmp',
                                                'filePrefix': 'pdf',
                                                'thumbPrefix': 'pdf',
                                                'sessionId': sessionId,
                                                'userId': userId,
                                                'keyPhase': keyPhase,
                                                'order': order
                                            };

                                            jobs.create('convertPdfFile', options).on('complete', function (result) {
                                                console.log("convertPdfFile finished ", result);
                                                _processPdfJob();
                                                _updateSessionStatus({'sessionId': sessionId, 'status': 1});
                                                res.end(">ok");
                                            }).on('failed', function () {
                                                _processPdfJob();
                                                res.end("error: an error occurred while converting PDF file");
                                            }).save(function (err) {
                                                if (!_isProcessingPdf) {
                                                    _isProcessingPdf = true;
                                                    _processPdfJob();
                                                }
                                            });
                                            break;
                                        case 'application/vnd.ms-powerpoint': //ppt
                                        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': //pptx
                                            var options = {
                                                'title': 'converting PPT/PPTX file <' + p + '>',
                                                'fileName': name,
                                                'filePath': p,
                                                'tmpPath': filePath + sails.config.CONSTANT.SEPERATOR + 'tmp',
                                                'toPath': filePath,
                                                'filePrefix': 'pdf',
                                                'thumbPrefix': 'pdf',
                                                'sessionId': sessionId,
                                                'userId': userId,
                                                'keyPhase': keyPhase,
                                                'order': order
                                            };

                                            var keepalive = setInterval(function () {
                                                res.write("-");
                                            }, 1000);

                                            _processPPTFile(options, function (err, data) {
                                                clearInterval(keepalive);
                                                if (err) return res.end("an error occurred while processing PPT/PPTX file");

                                                options.bypassPPT = true;
                                                options.fileId = data.fileId;
                                                jobs.create('convertOfficeFile', options).on('complete', function (result) {
                                                    console.log("convertOfficeFile finished ", result);
                                                    _processOfficeJob();
                                                }).on('failed', function () {
                                                    _processOfficeJob();
                                                }).save(function (err) {
                                                    if (!_isProcessingOffice) {
                                                        _isProcessingOffice = true;
                                                        _processOfficeJob();
                                                    }
                                                });

                                                req.session.sSlidesInfo = data;
                                                _updateSessionStatus({'sessionId': sessionId, 'status': 1});
                                                res.end(">ok");
                                            });
                                            break;
                                        case 'application/msword': //doc
                                        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': //docx
                                        case 'application/vnd.ms-excel': //xls
                                        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': //xlsx
                                            var options = {
                                                'title': 'converting Office file <' + p + '>',
                                                'fileName': name,
                                                'filePath': p,
                                                'tmpPath': filePath + sails.config.CONSTANT.SEPERATOR + 'tmp',
                                                'toPath': filePath,
                                                'filePrefix': 'pdf',
                                                'thumbPrefix': 'pdf',
                                                'sessionId': sessionId,
                                                'userId': userId,
                                                'keyPhase': keyPhase,
                                                'order': order
                                            };

                                            jobs.create('convertOfficeFile', options).on('complete', function (result) {
                                                console.log("convertOfficeFile finished ", result);
                                                _processOfficeJob();
                                                _updateSessionStatus({'sessionId': sessionId, 'status': 1});
                                                res.end(">ok");
                                            }).on('failed', function () {
                                                _processOfficeJob();
                                                res.end("an error occurred while converting Office file");
                                            }).save(function (err) {
                                                if (!_isProcessingOffice) {
                                                    _isProcessingOffice = true;
                                                    _processOfficeJob();
                                                }
                                            });
                                            break;
                                        case 'text/plain': //csv
                                            var options = {
                                                'filePath': p,
                                                'fileName': name,
                                                'sessionId': sessionId,
                                                'userId': userId
                                            };

                                            if (options.fileName.toLowerCase() == 'evaluation.txt') {
                                                console.log("Processing Evaluation");
                                                _processEvaluation(options, function (err, data) {
                                                    if (err) {
                                                        console.log("errrrrrrrrr: " + err);
                                                        res.end('File format error');
                                                    } else {
                                                        res.end('success');
                                                    }
                                                });
                                            } else {
                                                _checkQuizSlidesAndReturnFileId(options, function (err, fileId) {
                                                    if (fileId > 0) {
                                                        options.fileId = fileId;
                                                        _processQuiz(options, function (err, data) {
                                                            if (err) {
                                                                res.end('File format error');
                                                            } else {
                                                                res.end('success');
                                                            }
                                                        });
                                                    } else {
                                                        res.end('cannot find corresponding slides file');
                                                    }
                                                });
                                            }
                                            break;
                                        default:
                                            res.end('file format not supported');
                                    }
                                }
                            })
                        }
                    });
                });
            }
        });
    },

    end: function (req, res) {
        var sessionId = req.session.sSessionId || req.param('sessionId') || 0,
            role = req.session.sRole,
            userId = req.session.sUserId || req.param('userId') || 0,
            keyPhase = req.session.sKeyPhase || req.param('keyPhase');

        if (!sessionId || sessionId == 0 || !role || role != 'host') {
            return res.json({'error': "you are not the host of this session"});
        }

        // stop broadcasting if there's any
        StreamService.deleteroom(keyPhase);

        sails.io.sockets.in(keyPhase).emit('sessionEnd', {});

        var filePath = sails.config.CONSTANT.UPLOAD_PATH + sails.config.CONSTANT.SEPERATOR + keyPhase,
            slidePath = filePath + sails.config.CONSTANT.SEPERATOR + 'png',
            recordingPath = filePath + sails.config.CONSTANT.SEPERATOR + 'recording',
            outputPath = filePath + sails.config.CONSTANT.SEPERATOR + 'output';

        mkdirp(outputPath, function (err) {
            if (err) {
                sails.log.warn(err);
                return res.json({'error': 'could not write file system'});
            }

            var options = {
                'sessionId': sessionId,
                'userId': userId,
                'keyPhase': keyPhase,
                'filePath': filePath,
                'tmpPath': filePath + sails.config.CONSTANT.SEPERATOR + 'tmp',
                'slidePath': slidePath,
                'recordingPath': recordingPath,
                'outputPath': outputPath,
                'zipPath': filePath + sails.config.CONSTANT.SEPERATOR + keyPhase + '.zip',
                'zipTranscriptionPath': filePath + sails.config.CONSTANT.SEPERATOR + keyPhase + '-transcript.zip',
                'slidePrefix': 'pdf'
            };
            setTimeout(function () {
                _generateVideo(options, function (err, data) {
                    if (!err)
                        sails.log.info("Video created: " + data.output);
                })
            }, 10000);
        });
        _cleanupSession(req);

        return res.redirect('/login');
    },

    getuploadedfiles: function (req, res) {
        var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
            userId = req.param('userId') || req.session.sUserId || 0;

        var fileObj = {
            'where': {
                'sessionId': sessionId,
                or:[
					{'type': "pdf"},
					{'type': "url"}
				]
            },
            'sort': {'order': 1}
        };

        File.find(fileObj).exec(function (err, files) {
            if (err) {
                sails.log.warn(err);
                return res.json({'error': 'error occurred while searching uploaded files'});
            }

            for (var i = 0; i < files.length; i++) {
                if (files[i].type == 'pdf') {
					delete files[i].location;
				}
            }
            return res.json(files);
        });
    },
	
	editorAudioConvert: function (req, res) {
		var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
			sessionKey = req.param('sessionKey'),
			filePath = sails.config.CONSTANT.UPLOAD_PATH + sails.config.CONSTANT.SEPERATOR + sessionKey,
			recordingPath = filePath + sails.config.CONSTANT.SEPERATOR + 'recording' + sails.config.CONSTANT.SEPERATOR + 'editor';
		
		_getFileList({'toPath': recordingPath}, function(err, file){
			var recordings = Array(),
				audios = Array();
				
			if (err) {
				sails.log.warn(err);
				return res.json({'error': 'could not get audio'});
			}

			for (var i=0; i < file.files.length; i++) {
				var stats = fs.statSync(recordingPath + sails.config.CONSTANT.SEPERATOR + file.files[i]);
				if (stats["size"] > 0) {
					if (file.files[i].split(".")[1] == "wv") {
						recordings.push(file.files[i]);
					}
					if (file.files[i].split(".")[1] == "m4a") {
						audios.push(file.files[i]);
					}
				}				
			}	

			if (recordings.length == audios.length) {
				return res.json(audios);
			}				
			
			if (err) {
				sails.log.warn(err);
                return res.json({'error': 'could not find file.'});
			} else {
				for (var i=0; i<recordings.length; i++){
					_convertAudio({'filePath': recordingPath, 'tmpPath': recordingPath, 'fileName': recordings[i]}, function (err, file) {
						_convertAudioy({'filePath': recordingPath, 'tmpPath': recordingPath, 'fileName': file.fileName.split('.')[0] + '.m4a'}, function (err, filey) {
							audios.push(filey.fileName);
							if (audios.length == recordings.length) {
								return res.json(audios);
							}
						});
					});
				}			
			}		
		});
	},
	
	isStreaming: function(req, res){
		var sessionId = req.param('sessionId') || req.session.sSessionId || 0;
		
		Session.findOne(sessionId).exec(function(err, session){
			if (err) {
				sails.log.warn(err);
				return res.json({'error': 'could not find session'});
			}
			
			return res.json(session);
		});
	}
};

function _updateSessionStatus(options, cb) {
    Session.update(options.sessionId, {'status': options.status}).exec(function (err) {
        if (err) {
            sails.log.error(err);
            if (isFunction(cb)) cb(err);
        } else {
            console.log("change session status to " + options.status);
            if (isFunction(cb)) cb(null, options.status);
        }
    });
}

function _generateKeyPhaseAndCreateSession(req, res) {
    var keyPhase = Session.generateKeyPhase();
    Session.findOne({'keyPhase': keyPhase}).exec(function (err, session) {
        if (err) {
            sails.log.warn(err);
            return res.json({'error': 'could not generate keyphase'});
        }

        if (!session) {

            var name = req.param('name');
            var password = req.param('password');
            var isRemote = req.param('isRemote');
            var creatorId = req.param('userId') || 0;

            var sessionObj = {
                'name': name,
                'keyPhase': keyPhase,
                'password': password,
                'isRemote': isRemote === 'true',
                'creatorId': creatorId
            };

            Session.create(sessionObj).done(function (err, session) {

                // Error handling
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create session"});

                    // The Session was created successfully!
                } else {
                    req.session.sSessionId = session.id;
                    req.session.sSessionName = session.name;
                    req.session.sKeyPhase = keyPhase;
                    req.session.sRole = 'host';
                    req.session.sPage = 0;

                    var isMobile = isCallerMobile(req);
                    sails.log.info("Is Mobile:", isMobile);
                    session.isMobile = isMobile;

                    sails.log.info("Session created:", session);
                    return res.json(session);
                }
            });

        } else {
            _generateKeyPhaseAndCreateSession(req, res);
        }
    });
}

function _checkQuizSlidesAndReturnFileId(options, cb) {
    File.find({'sessionId': options.sessionId, 'userId': options.userId}).exec(function (err, files) {
        if (err) {
            return cb(err, 0);
        }
        if (files.length == 0) {
            return cb({'error': 'cannot find corresponding slides file'}, 0);
        }

        for (var i = 0; i < files.length; i++) {
            var file = files[i],
                slidesFileName = file.name.split("."),
                quizFileName = options.fileName.split(".");

            slidesFileName.pop();
            quizFileName.pop();

            console.log("filename: " + options.fileName.toLowerCase());

            if (options.fileName.toLowerCase() == 'evaluation.txt') {
                return cb(null, 0);
            } else if (slidesFileName.join(".") == quizFileName.join(".")) {
                return cb(null, file.id);
            } else {

            }
        }
        return cb({'error': 'cannot find corresponding slides file'}, 0);
    });
}
/*
function _processQuiz(options, cb) {
    sails.log.info("processing Quiz file (CSV file)");

    var now = Date.now(),
        questions = 0,
        flag = true, //same question flag
        q = "",
        i = 0,
        page = 0, keyword = "";
    fs.createReadStream(options.filePath)
        .pipe(csv({
            'headers': ['quiz', 'page', 'keyword'],
            'raw': false,    // do not decode to utf-8 strings
            'separator': '|' // specify optional cell seperator
        }))
        .on('data', function (data) {
            if (typeof data.quiz == 'undefined') {
                if (!flag) {
                    q += i == 0 ? "}" : "]}";

                    var quizObj = {
                        'sessionId': options.sessionId,
                        'page': page,
                        'fileId': options.fileId,
                        'question': q,
                        'options': i,
                        'keyword': keyword
                    };
                    Quiz.create(quizObj).done(function (err, quiz) {
                        // after quiz inserted into database
                    });
                }

                q = "";
                page = 0;
                keyword = "";
                flag = true;
            } else {
                if (flag) {
                    q = "{\"question\":\"" + data.quiz + "\"";
                    questions++;
                    page = typeof data.page == 'undefined' ? 0 : parseInt(data.page);
                    keyword = typeof data.keyword == 'undefined' ? '' : data.keyword;
                    i = 0;
                } else {
                    q += i == 0 ? ",\"options\":[\"" + data.quiz + "\"" : ",\"" + data.quiz + "\"";
                    i++;
                }
//                console.log('row', data);
                flag = false;
            }
        })
        .on('end', function () {
            if (q !== "") {
                q += i == 0 ? "}" : "]}";
                var quizObj = {
                    'sessionId': options.sessionId,
                    'page': page,
                    'fileId': options.fileId,
                    'question': q,
                    'options': i,
                    'keyword': keyword
                };
                Quiz.create(quizObj).exec(function (err, quiz) {
//                    console.log("----------> " + options.filePath);
                    // delete file after import
                    fs.unlink(options.filePath, function (err) {
                        if (err) sails.log.warn('exec err: ' + err);
                    });
                });
            }

            console.log('parsed ' + questions + ' questions in ' + (Date.now() - now) + ' ms');
            cb(null, {'result': 'success', 'questions': questions});
        });

} */

function _processQuiz(options, cb) {
    var now = Date.now(),
        questions = 0,
        flag = true, //same question flag
        q = "",
        i = 0,
        page = 0, keyword = "";
    var content;

    fs.readFile(options.filePath, function (err, data) {
        try {
            content = JSON.parse(data);
        }
        catch (err) {
            sails.log.warn(err);
            return cb(err);
        }

        var obj;

        for (var i = 0; i < content.length; i++) {
            obj = {
                'sessionId': options.sessionId,
                'question': JSON.stringify(content[i]),
                'page': content[i].page,
                'fileId': options.fileId,
                'options': content[i].options ? content[i].options.length : 0,
                'keyword': content[i].keyword
            };
            console.log("obj: " + obj);
            Quiz.create(obj).done(function (err, evaluation) {
                if (err) console.log(err);
                cb(null, {'result': 'success', 'questions': questions});
            });
        }
    });
}

function _processEvaluation(options, cb) {
    var now = Date.now(),
        questions = 0,
        q = "",
        i = 0;
    var content;

    fs.readFile(options.filePath, function (err, data) {
        try {
            content = JSON.parse(data);
        }
        catch (err) {
            sails.log.warn(err);
            console.log("err: " + err);
            return cb(err);
        }

        var obj;

        for (var i = 0; i < content.length; i++) {
            obj = {
                'sessionId': options.sessionId,
                'question': JSON.stringify(content[i]),
                'options': content[i].options ? content[i].options.length : 0
            };
            console.log("obj: " + obj);
            Evaluation.create(obj).done(function (err, evaluation) {
                if (err) console.log(err);
                cb(null, {'result': 'success', 'questions': questions});
            });
        }
    });
}

function _processPPTFile(options, cb) {
    mkdirp(options.toPath + sails.config.CONSTANT.SEPERATOR + "png", function (err) {
        if (err !== null) {
            console.log('exec error: ' + err);
            cb(err);
        } else {
            mkdirp(options.tmpPath, function (err) {
                if (err !== null) {
                    console.log('exec error: ' + err);
                    cb(err);
                } else {
                    var spawn = require('child_process').spawn,
                        ls = spawn('CScript', ['//NoLogo', sails.config.CONSTANT.PPT_TO_PNG_SCRIPT_PATH, options.toPath + sails.config.CONSTANT.SEPERATOR, options.fileName]);

                    ls.stdout.on('data', function (data) {
                        console.log('stdout: ' + data);
                    });

                    ls.stderr.on('data', function (data) {
                        console.log('stderr: ' + data);
                    });

                    ls.on('close', function (code) {
                        if (code == 0) {
                            _getFileList({'toPath': options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName}, function (err, data) {
                                if (err) {
                                    sails.log.warn(err);
                                    return cb(err, null);
                                }
                                File.find({'sessionId': options.sessionId, 'type': 'pdf'}).exec(function (err, sessionFiles) {
                                    var order = options.order;
									if (order == 0) {
										if (sessionFiles.length > 0) {
											for (var i = 0; i < sessionFiles.length; i++) {
												order = sessionFiles[i].order > order ? sessionFiles[i].order : order;
											}
										}
										order++;
									}

                                    var fileObj = {
                                        'sessionId': options.sessionId,
                                        'userId': options.userId,
                                        'name': options.fileName,
                                        'location': options.filePath + ".pdf",
                                        'size': data.pages,
                                        'type': 'pdf',
                                        'order': order
                                    };
                                    File.create(fileObj).done(function (err, file) {
                                        if (err) {
                                            console.log('exec error: ' + err);
                                            return cb(err, null);
                                        }
                                        sails.log.info("PDF file " + file.name + " in " + file.location + " processed.");

                                        _extractSlideNote({
                                            'path': options.filePath,
                                            'sessionId': options.sessionId,
                                            'fileId': file.id
                                        }, function (code) {
                                            if (code != 0) {
                                                sails.log.warn("error occurred when extracting ppt notes");
                                            }
                                            var toPath = options.toPath + sails.config.CONSTANT.SEPERATOR + 'png',
                                                startNum = _getLastFileNumber(toPath),
                                                toPathFiles = [],
                                                toFileNumbers = [],
                                                finishedFile = 0;
                                            for (var i = 0; i < data.pages; i++) {
                                                // move tmp file to toPath
                                                var slidePath = _generateSlidePath(toPath, options.filePrefix, startNum + i),
                                                    fromP = options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName + sails.config.CONSTANT.SEPERATOR + data.files[i],
                                                    toP = slidePath.slidePath;
                                                try {
//                                                fs.renameSync(fromP, toP);
                                                    var instream = fs.createReadStream(fromP),
                                                        outstream = fs.createWriteStream(toP);
                                                    outstream.on('finish', function () {
                                                        finishedFile++;
                                                        if (finishedFile == data.pages) {
                                                            uploadToS3();
                                                        }
                                                    });
                                                    instream.pipe(new pngquant([24])).pipe(outstream);
                                                    toPathFiles.push(toP);
                                                    toFileNumbers.push(slidePath.fileNumber);
                                                } catch (e) {
                                                    sails.log.warn(e);
                                                }
                                            }

                                            function uploadToS3() {
                                                // send pdf png to S3
                                                S3Service.uploadPNG({
                                                    'filePath': toPathFiles,
                                                    'fileNumber': toFileNumbers,
                                                    'keyPhase': options.keyPhase,
                                                    'sessionId': options.sessionId,
                                                    'userId': options.userId,
                                                    'order': order
                                                }, function (err, filesArray) {
                                                    data.fileId = file.id;
                                                    data.files = filesArray;
                                                    _deleteFolderSync(options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName);
                                                    cb(err, data);
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        } else {
                            cb({'error': "error occurred when processing PPT/PPTX file"});
                        }
                    });
                }
            });
        }
    });
}

function _processOfficeFile(options, cb) {
    sails.log.info("processing Office file");

    var file = options.filePath;
    var dir = options.toPath;
    var filePrefix = options.filePrefix;

    _convertOfficeFile({'filePath': file}, function (error, result) {
        if (error) {
            sails.log.warn(error);
        }
        var filePath = result.filePath;
        console.log('-----------------');
        console.log(result);
        console.log('fromPath: ' + filePath + ', toPath: ' + dir + sails.config.CONSTANT.SEPERATOR + 'png' + ', filePrefix: ' + filePrefix);
        console.log('-----------------');

        if (options.bypassPPT) {
            _extractPDFText({'sessionId': options.sessionId, 'fileId': options.fileId, 'filePath': file + '.pdf'}, function (err, pagedata) {
                fs.unlink(file, function (err) {
                    if (err) {
                        sails.log.error(err);
                    }
                    console.log('successfully deleted ' + file);
                });
                _getFileListFromDb({'sessionId': options.sessionId}, function (err, slidesInfo) {
                    cb(err, slidesInfo);
                });
            });
        } else {
            _splitPDF({'fromPath': filePath, 'toPath': dir + sails.config.CONSTANT.SEPERATOR + 'png', 'filePath': options.filePath,
                'thumbPath': dir + sails.config.CONSTANT.SEPERATOR + 'thumb', 'filePrefix': filePrefix, 'thumbPrefix': options.thumbPrefix,
                'sessionId': options.sessionId, 'userId': options.userId, 'keyPhase': options.keyPhase, 'fileName': options.fileName,
                'tmpPath': options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName, 'order': options.order}, function (err, files) {
                if (err) {
                    sails.log.warn(err);
                    cb(err);
                } else {
                    fs.unlink(file, function (err) {
                        if (err) throw err;
                        console.log('successfully deleted ' + file);
                    });

                    var slidesInfo = files;
                    cb(null, slidesInfo);
                }
            });
        }
    });
}

function _processPDF(options, cb) {
    sails.log.info("processing PDF file");

    var file = options.filePath;
    var dir = options.toPath;
    var filePrefix = options.filePrefix;

    _splitPDF({'fromPath': file, 'toPath': dir + sails.config.CONSTANT.SEPERATOR + 'png', 'filePath': file,
        'thumbPath': dir + sails.config.CONSTANT.SEPERATOR + 'thumb', 'filePrefix': filePrefix, 'thumbPrefix': options.thumbPrefix,
        'sessionId': options.sessionId, 'userId': options.userId, 'keyPhase': options.keyPhase, 'fileName': options.fileName,
        'tmpPath': options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName, 'order': options.order}, function (err, files) {
        if (err) {
            sails.log.warn(err);
            cb(err);
        } else {
            var slidesInfo = files;
            cb(null, slidesInfo);
        }
    });
}

function _convertOfficeFile(options, cb) {
    var exec = require('child_process').exec,
        child;

    var filePath = options.filePath + ".pdf",
//        command = 'officetopdf /hidden /readonly /print "' + options.filePath + '" "' + filePath + '"';
        command = 'convert2pdf "' + options.filePath + '"';
    child = exec(command,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            console.log('<convertOfficeFile> ' + filePath);
            return cb(null, {'status': 'finished', 'filePath': filePath});
        });
}

function _extractSlideNote(options, cb) {
    var filetype = options.path.split(".").pop();
    if (filetype == "ppt" || filetype == "pptx") {
        var spawn = require('child_process').spawn,
            ls = spawn('CScript', ['//NoLogo', sails.config.CONSTANT.SLIDE_NOTE_SCRIPT_PATH, options.path]);

        ls.stdout.on('data', function (data) {
            //var note = ('' + data).replace(/\r?\n/g, "").split("|");
            var note = ('' + data).split("|");
            slidenoteObj = {
                "sessionId": options.sessionId,
                "fileId": options.fileId,
                "page": note[0],
                "content": note[1]
            };

            SlideNote.create(slidenoteObj).done(function (err, slidenote) {
//                console.log("Inserted slide note: " + slidenote);
            });
        });

        ls.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        ls.on('close', function (code) {
            cb(code);
        });
    } else {
        cb(0);
    }
}

function _getPDFPages(options, cb) {
    var exec = require('child_process').exec,
        child;

    var command = 'pdfinfo "' + options.filePath + '"' + " | grep Pages | sed 's/[^0-9]*//'";
    child = exec(command,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            return cb(error, parseInt(stdout));
        });
}

function _splitPDF(options, cb) {
    var exec = require('child_process').exec,
        child;

    mkdirp(options.toPath, function (err) {
        if (err) {
            sails.log.warn(err);
            return res.json({'error': 'could not write file system'});
        }
        mkdirp(options.tmpPath, function (err) {
            if (err !== null) {
                console.log('exec error: ' + err);
            }
            mkdirp(options.thumbPath, function (err) {
                if (err !== null) {
                    console.log('exec error: ' + err);
                }
                var command = (sails.config.CONSTANT.IS_WINDOWS ? 'pdftopng -q -r 100 -aa yes -aaVector yes ' : 'pdftocairo -png ') +
                    '"' + options.fromPath + '" "' + options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.filePrefix + '"';
                child = exec(command,
                    function (error, stdout, stderr) {
                        if (error !== null) {
                            sails.log.warn('exec error: ' + error);
                        } else {
                            _getFileList({'toPath': options.tmpPath}, function (err, data) {
                                if (err) {
                                    console.log('exec error: ' + error);
                                    return cb(err, null);
                                }

                                File.find({'sessionId': options.sessionId, 'type': 'pdf'}).exec(function (err, sessionFiles) {
                                    var order = options.order;
									if (order == 0) {
										if (sessionFiles.length > 0) {
											for (var i = 0; i < sessionFiles.length; i++) {
												order = sessionFiles[i].order > order ? sessionFiles[i].order : order;
											}
										}
										order++;
									}
									console.log("options.order: " + options.order);
									console.log("order: " + order);
                                    var fileObj = {
                                        'sessionId': options.sessionId,
                                        'userId': options.userId,
                                        'name': options.fileName,
                                        'location': options.fromPath,
                                        'size': data.pages,
                                        'type': 'pdf',
                                        'order': order
                                    };
									console.log("fileObj: " + fileObj);
                                    File.create(fileObj).done(function (err, file) {
                                        if (err) {
                                            console.log('exec error: ' + err);
                                            return cb(err, null);
                                        }
                                        sails.log.info("PDF file " + file.name + " in " + file.location + " processed.");

                                        _extractSlideNote({
                                            'path': options.filePath,
                                            'sessionId': options.sessionId,
                                            'fileId': file.id
                                        }, function (code) {
                                            if (code != 0) {
                                                sails.log.warn("error occurred when extracting ppt notes");
                                            }

                                            _extractPDFText({'sessionId': options.sessionId, 'fileId': file.id, 'filePath': file.location}, function (err, pagedata) {
                                                if (err) sails.log.warn("<_extractPDFText> " + err);

                                                var startNum = _getLastFileNumber(options.toPath),
                                                    toPathFiles = [],
                                                    toFileNumbers = [],
                                                    finishedFile = 0;
                                                for (var i = 0; i < data.pages; i++) {
                                                    // move tmp file to toPath
                                                    var slidePath = _generateSlidePath(options.toPath, options.filePrefix, startNum + i),
                                                        fromP = options.tmpPath + sails.config.CONSTANT.SEPERATOR + data.files[i],
                                                        toP = slidePath.slidePath;
                                                    try {
//                                                    fs.renameSync(fromP, toP);
                                                        var instream = fs.createReadStream(fromP),
                                                            outstream = fs.createWriteStream(toP);
                                                        outstream.on('finish', function () {
                                                            finishedFile++;
                                                            if (finishedFile == data.pages) {
                                                                uploadToS3();
                                                            }
                                                        });
                                                        instream.pipe(new pngquant([24])).pipe(outstream);
                                                        toPathFiles.push(toP);
                                                        toFileNumbers.push(slidePath.fileNumber);
                                                    } catch (e) {
                                                        sails.log.warn(e);
                                                    }
                                                }

                                                function uploadToS3() {
                                                    // send pdf png to S3
                                                    S3Service.uploadPNG({
                                                        'filePath': toPathFiles,
                                                        'fileNumber': toFileNumbers,
                                                        'keyPhase': options.keyPhase,
                                                        'sessionId': options.sessionId,
                                                        'userId': options.userId,
                                                        'order': order
                                                    }, function (err, filesArray) {
                                                        data.files = filesArray;
                                                        _deleteFolderSync(options.tmpPath);
                                                        cb(err, data);
                                                    });
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
            });
        });
    });
}

function _getFileList(options, cb) {
    fs.readdir(options.toPath, function (err, files) {
        if (err) {
            console.log('exec error: ' + err);
            return cb(err, null);
        }
//        console.log("<_getFileList> " + files);
        var returnFiles = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i],
                stats = fs.statSync(options.toPath + sails.config.CONSTANT.SEPERATOR + file);
            if (stats.isFile()) {
                returnFiles.push(file);
            }
        }
        return cb(null, {'pages': returnFiles.length, 'files': returnFiles});
    });
}

function _getFileListFromDb(options, cb) {
    File.find({'where': {'sessionId': options.sessionId, 'type': "png"}, 'sort': {'order': 1, 'name': 1}}).exec(function (err, files) {
        if (err) return cb(err);
        else {
            var fileList = [];
			var pngId = [];
            for (var i = 0; i < files.length; i++) {
                fileList.push(files[i].location);
				pngId.push(files[i].id);
            }
            return cb(null, {'pages': fileList.length, 'files': fileList, 'pngId': pngId});
        }
    });
}

function _generateVideo(options, cb) {
    var jobs = sails.config.GLOBAL.JOBS;

    _getFileList({'toPath': options.recordingPath}, function (err, files) {
        if (err !== null) {
            console.log('exec error: ' + err);
            return cb(err);
        }
        if (files.files.length == 0) return cb({'error': 'no recording found'});

        mkdirp(options.tmpPath, function (err) {
            if (err !== null) {
                console.log('exec error: ' + err);
            }

            //-------------------------------
            // generateVideo starts here
            //-------------------------------
            options.files = files;
            jobs.create('generateVideo-' + options.keyPhase, options).on('complete', function (result) {
                sails.log.info("generateVideo finished ", result);

                // start compress zip and upload
                File.find({'sessionId': options.sessionId, 'type': "pdf"}).exec(function (err, dbfiles) {
                    if (err) {
                        sails.log.warn(err);
                    } else {
                        if (dbfiles.length > 0) {
                            var fileArray = [];
                            for (var i = 0; i < dbfiles.length; i++) {
                                fileArray.push(dbfiles[i].location);
                            }

                            _generatePackingFiles({'path': options.filePath}, function (packingFiles) {
                                // put additional packing files into the zip file
                                fileArray = fileArray.concat(packingFiles);

                                _zipFile({
                                    'zipPath': options.zipPath,
                                    'fromPath': fileArray.concat([options.outputPath])
                                }, function (code) {
                                    console.log("zip compression completed");

                                    // remove additional packing files
                                    for (var i = 0; i < packingFiles.length; i++) {
                                        fs.unlink(packingFiles[i], function (err) {
                                            if (err) sails.log.warn('exec err: ' + err);
                                        });
                                    }

                                    if (code == 0) {
                                        _generateHash({'path': options.zipPath}, function (err, hash) {
                                            if (err) {
                                                sails.log.warn(err);
                                            } else {
                                                // S3 upload
                                                fs.readFile(options.zipPath, function (err, data) {
                                                    if (err) {
                                                        sails.log.warn(err);
                                                    } else {
                                                        var now = new Date(),
                                                            stats = fs.statSync(options.zipPath),
                                                            zipFileName = ["recording", now.getFullYear(), ("0" + (now.getMonth() + 1)).slice(-2),
                                                                ("0" + now.getDate()).slice(-2), options.keyPhase, hash.md5].join("-") + ".zip";
                                                        S3Service.put({
                                                            Key: zipFileName,
                                                            Body: data,
                                                            ContentMD5: hash.base64,
                                                            ContentLength: stats["size"],
                                                            ContentType: 'application/zip'
                                                        }, function (err, result) {
                                                            if (err) {
                                                                console.log("Error uploading data: ", err);
                                                            } else {
                                                                File.create({
                                                                    'sessionId': options.sessionId,
                                                                    'userId': options.userId,
                                                                    'name': zipFileName,
                                                                    'location': sails.config.CONSTANT.S3_BUCKET + '.s3.amazonaws.com/' + zipFileName,
                                                                    'size': stats["size"],
                                                                    'type': 'zip'
                                                                }).done(function (err, newFile) {
                                                                    Session.update({'id': options.sessionId}, {'status': 4}, function (err, sessionArr) {
                                                                        if (err) sails.log.warn(err);
                                                                    });
                                                                    fs.unlink(options.zipPath, function (err) {
                                                                        if (err) sails.log.warn('exec err: ' + err);
                                                                    });
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    }
                });
            }).on('failed', function () {
                sails.log.warn({'error': "an error occurred while generating video file"});
            }).on('progress', function (progress) {
                console.log('<_generateVideo> ' + options.outputPath + ' ' + progress + '% complete');
            }).save(function (err) {
                _processVideoJob();
            });

            function _processVideoJob() {
                jobs.process('generateVideo-' + options.keyPhase, 1, function (job, done) {
                    var options = job.data,
                        files = options.files,
                        len = files.files.length;

                    function next(i) {
                        job.progress(i, len);

                        if (i == len) {
                            done(null, {'message': "generate video finished"});
                        } else {
                            var filename = files.files[i];

                            var stats = fs.statSync(options.recordingPath + sails.config.CONSTANT.SEPERATOR + filename);
                            if (stats["size"] > 0) {
                                _convertAudio({'filePath': options.recordingPath, 'tmpPath': options.tmpPath, 'fileName': filename}, function (err, file) {
                                    if (err !== null) {
                                        sails.log.warn('exec error: ' + err);
                                        next(i + 1);
                                    } else {
                                        var page = file.fileName.split("-")[1].split(".")[0],
                                            slideFile = _generateSlidePath(options.slidePath, options.slidePrefix, parseInt(page) + 1),
                                            outputFile = options.outputPath + sails.config.CONSTANT.SEPERATOR + file.fileName;

                                        _createVideo({'slideFile': slideFile.slidePath, 'recordingFile': file.recordingFile, 'outputFile': outputFile}, function (err, data) {
                                            sails.log.info("Video created: " + data.output);
                                            var tmpFile = options.tmpPath + sails.config.CONSTANT.SEPERATOR + file.fileName.split(".")[0] + '.m4a';
                                            fs.unlink(tmpFile, function (err) {
                                                if (err) sails.log.warn(err);
                                            });

                                            next(i + 1);
                                        });
                                    }
                                });
                            } else {
                                next(i + 1);
                            }
                        }
                    }

                    if (len > 0) {
                        next(0);
                    } else {
                        done(null, {'message': "generate video finished"});
                    }
                });
            }

            //-------------------------------
            // generateTransctipt starts here
            //-------------------------------
            if (sails.config.CONSTANT.ATT_ENABLE) {
                jobs.create('generateTranscript-' + options.keyPhase, options).on('complete', function (result) {
                    sails.log.info("generateTranscript finished ", result);

                    // filter out only transcript text files
                    var zipFileFromPath = [];
                    for (var i = 0; i < options.files.files.length; i++) {
                        var filename = options.files.files[i];
                        filename = options.filePath + sails.config.CONSTANT.SEPERATOR + filename.split(".")[0] + '.txt';
                        zipFileFromPath.push(filename);
                    }
                    // pack finished transcription
                    _zipFile({
                        'zipPath': options.zipTranscriptionPath,
                        'fromPath': zipFileFromPath //[options.filePath + sails.config.CONSTANT.SEPERATOR + "*.txt"]
                    }, function (code) {
                        if (code == 0) {
                            _generateHash({'path': options.zipTranscriptionPath}, function (err, hash) {
                                if (err) {
                                    sails.log.warn(err);
                                } else {
                                    // S3 upload
                                    fs.readFile(options.zipTranscriptionPath, function (err, data) {
                                        if (err) {
                                            sails.log.warn(err);
                                        } else {
                                            var now = new Date(),
                                                stats = fs.statSync(options.zipTranscriptionPath),
                                                zipFileName = ["recording", "transcript", now.getFullYear(), ("0" + (now.getMonth() + 1)).slice(-2),
                                                    ("0" + now.getDate()).slice(-2), options.keyPhase, hash.md5].join("-") + ".zip";
                                            S3Service.put({
                                                Key: zipFileName,
                                                Body: data,
                                                ContentMD5: hash.base64,
                                                ContentLength: stats["size"],
                                                ContentType: 'application/zip'
                                            }, function (err, result) {
                                                if (err) {
                                                    console.log("Error uploading data: ", err);
                                                } else {
                                                    File.create({
                                                        'sessionId': options.sessionId,
                                                        'userId': options.userId,
                                                        'name': zipFileName,
                                                        'location': sails.config.CONSTANT.S3_BUCKET + '.s3.amazonaws.com/' + zipFileName,
                                                        'size': stats["size"],
                                                        'type': 'zip'
                                                    }).done(function (err, newFile) {
                                                        Session.update({'id': options.sessionId}, {'status': 4}, function (err, sessionArr) {
                                                            if (err) sails.log.warn(err);
                                                        });
                                                        fs.unlink(options.zipTranscriptionPath, function (err) {
                                                            if (err) sails.log.warn('exec err: ' + err);
                                                        });

                                                        _deleteTxtFilesSync(options.filePath);
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }).on('failed', function () {
                    sails.log.warn({'error': "an error occurred while generating transcript file"});
                }).on('progress', function (progress) {
                    console.log('<_generateTranscript> ' + options.outputPath + ' ' + progress + '% complete');
                }).save(function (err) {
                    _processTranscriptJob();
                });

                function _processTranscriptJob() {
                    jobs.process('generateTranscript-' + options.keyPhase, 1, function (job, done) {
                        _generateSrgs({'sessionId': options.sessionId}, function (err, srgs) {
                            var options = job.data,
                                files = options.files,
                                len = files.files.length;

                            function next(i) {
                                job.progress(i + 1, len);

                                if (i == len) {
                                    done(err, {'message': "generate transcript finished"});
                                } else {
                                    var filename = files.files[i],
                                        stats;
                                    try {
                                        stats = fs.statSync(options.recordingPath + sails.config.CONSTANT.SEPERATOR + filename);
                                    } catch (e) {
                                        sails.log.warn(e);
                                        stats = {'size': 0};
                                    }
                                    if (stats["size"] > 0) {
                                        _convertAudioOggVorbis({'filePath': options.recordingPath, 'tmpPath': options.tmpPath, 'fileName': filename}, function (err, file) {
                                            if (err !== null) {
                                                sails.log.warn('exec error: ' + err);
                                                next(i + 1);
                                            } else {
                                                var jobQueueName = 'requestTranscript-' + options.keyPhase + file.fileName,
                                                    splitedFilePath = options.tmpPath + sails.config.CONSTANT.SEPERATOR + file.fileName.split(".")[0];

                                                _splitAudio({'fromPath': file.recordingFile, 'toPath': splitedFilePath}, function (err, splitedFiles) {
                                                    if (err !== null) {
                                                        sails.log.warn('exec error: ' + err);
                                                        next(i + 1);
                                                    } else {
                                                        console.log('<_splitAudio> ' + splitedFiles);

                                                        // remove old ogg files
                                                        var tmpOggFile = options.tmpPath + sails.config.CONSTANT.SEPERATOR + file.fileName.split(".")[0] + '.ogg';
                                                        fs.unlink(tmpOggFile, function (err) {
                                                            if (err) sails.log.warn('exec err: ' + err);
                                                        });

                                                        jobs.create(jobQueueName, {'path': splitedFilePath, 'files': splitedFiles}).on('complete', function (result) {
                                                            sails.log.info("generateTranscript finished ", result);

                                                            // clear tmp files
                                                            _deleteFolderSync(splitedFilePath);

                                                            next(i + 1);
                                                        }).on('failed', function () {
                                                            sails.log.warn({'error': "an error occurred while generating transcript file"});
                                                        }).on('progress', function (progress) {
                                                            console.log('<_processRecordingFile> ' + progress + '% complete');
                                                        }).save(function (err) {
                                                            _processRecordingFile();
                                                        });

                                                        function _processRecordingFile() {

                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    } else
                                        next(i + 1);
                                }
                            }

                            if (len > 0) {
                                next(0);
                            } else {
                                done(null, {'message': "generate transcript finished"});
                            }
                        });
                    });
                }
            }

            return cb(null, {'output': 'generating video'});
        });
    });
}

function _createVideo(options, cb) {
    var exec = require('child_process').exec,
        child;

    var command = 'ffmpeg -loop 1 -r 2 -i "' + options.slideFile + '" -i "' + options.recordingFile +
        '" -c:v libx264 -c:a copy -pix_fmt yuv420p -vf "scale=trunc(iw/5)*2:trunc(ih/5)*2" -shortest "' + options.outputFile + '"';
//    console.log(command);
    child = exec(command,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            setTimeout(function () {
                cb(error, {'output': options.outputFile});
            }, 1000);
        });
}

function _generatePackingFiles(options, cb) {
    if (sails.config.CONSTANT.IS_WINDOWS) {
        var spawn = require('child_process').spawn,
            ls = spawn('CScript', ['//NoLogo', sails.config.CONSTANT.PACKING_SCRIPT_PATH, options.path]);

        ls.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
        });

        ls.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        ls.on('close', function (code) {
            var fileArray = [];
            for (var i = 0; i < sails.config.CONSTANT.PACKING_ADDITIONAL_FILES.length; i++) {
                fileArray.push(options.path + sails.config.CONSTANT.SEPERATOR + sails.config.CONSTANT.PACKING_ADDITIONAL_FILES[i]);
            }
            cb(fileArray);
        });
    } else {
        cb([]);
    }
}

function _convertAudio(options, cb) {
    var exec = require('child_process').exec,
        child;
    var fromFile = options.filePath + sails.config.CONSTANT.SEPERATOR + options.fileName,
        toFile = options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName.split(".")[0] + '.m4a';

    var command = 'ffmpeg -i "' + fromFile + '" "' + toFile + '"';
    child = exec(command,
        function (error, stdout, stderr) {
			if (error !== null) {
                console.log('exec error: ' + error);
            }

            setTimeout(function () {
                cb(error, {'fileName': options.fileName.split(".")[0] + '.mp4', 'recordingFile': toFile});
            }, 1000);
        });
}

function _convertAudioy(options, cb) {
    var exec = require('child_process').exec,
        child;
    var fromFile = options.filePath + sails.config.CONSTANT.SEPERATOR + options.fileName,
        toFile = fromFile;

    var command = 'ffmpeg -i "' + fromFile + '" "' + toFile + '" ' + '-y';
    child = exec(command,
        function (error, stdout, stderr) {
			if (error !== null) {
                console.log('exec error: ' + error);
            }

            setTimeout(function () {
                cb(error, {'fileName': options.fileName.split(".")[0] + '.m4a', 'recordingFile': toFile});
            }, 1000);
        });
}

function _convertAudioOggVorbis(options, cb) {
    var exec = require('child_process').exec,
        child;
    var fromFile = options.filePath + sails.config.CONSTANT.SEPERATOR + options.fileName,
        toFile = options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName.split(".")[0] + '.ogg';

    var command = 'ffmpeg -i "' + fromFile + '" -c:a libvorbis -q:a 4 "' + toFile + '"';
    child = exec(command,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            setTimeout(function () {
                cb(error, {'fileName': options.fileName.split(".")[0] + '.ogg', 'recordingFile': toFile});
            }, 1000);
        });
}

function _splitAudio(options, cb) {
    var fromFile = options.fromPath,
        toPath = options.toPath;
    var spawn = require('child_process').spawn,
        ls = spawn(sails.config.CONSTANT.MP3SPLT_PATH, ['-t', '1.00', '-a', '-d', toPath, fromFile]);

    ls.stdout.on('data', function (data) {
//        console.log('stdout: ' + data);
    });

    ls.stderr.on('data', function (data) {
//        console.log('stderr: ' + data);
    });

    ls.on('close', function (code) {
        if (code == 0) {
            setTimeout(function () {
                _getFileList({'toPath': toPath}, function (err, files) {
                    console.log(toPath);
                    cb(err, files.files);
                });
            }, 1000);
        } else {
            cb({'error': "split audio error"});
        }
    });
}

function _convertAudioOggSpeex(options, cb) {

}

function _convertAudioWav(options, cb) {
    var exec = require('child_process').exec,
        child;
    var fromFile = options.filePath + sails.config.CONSTANT.SEPERATOR + options.fileName,
        toFile = options.tmpPath + sails.config.CONSTANT.SEPERATOR + options.fileName.split(".")[0] + '.wav';

    var command = 'ffmpeg -i "' + fromFile + '" -ar 8000 -ac 1 "' + toFile + '"';
    child = exec(command,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            setTimeout(function () {
                cb(error, {'fileName': options.fileName.split(".")[0] + '.wav', 'recordingFile': toFile});
            }, 1000);
        });
}

function _generateSrgs(options, cb) {
    var sessionId = options.sessionId,
        srgs = ['<grammar root="top" xml:lang="en-US"><rule id="top" scope="public">'];

    SlideText.find({'sessionId': sessionId}, function (err, slidetexts) {
        if (err) {
            sails.log.warn(err);
            return cb(err, '');
        }
        var words = [];
        for (var i = 0; i < slidetexts.length; i++) {
            var slidetext = slidetexts[i];
            var keywords = JSON.parse(slidetext.content);
            for (var j = 0; j < keywords.length; j++) {
                var w = keywords[j].toLowerCase();
                if (words.indexOf(w) == -1 && (/^[a-zA-Z ]+$/.test(w))) {
                    words.push(w);
                }
            }
        }
        for (var i = 0; i < words.length; i++) {
            srgs.push('<item repeat="0-">' + words[i] + '</item>');
        }
        srgs.push('</rule></grammar>');
        cb(null, srgs.join(''));
    });
}

function _getSpeechRecognition(options, cb) {
    var file = options.file,
        fileName = options.fileName,
        part = options.part,
        srgs = options.srgs;
    var watson = new Watson({access_token: sails.config.CONSTANT.ATT_TOKEN});
    watson.speechToTextCustom(
        file,
        srgs,
        function (err, result) {
            console.log(JSON.stringify(result));
            if (err) {
                sails.log.warn(err);
                return cb(err);
            }
            var words = [],
                returnwords = result.Recognition ? result.Recognition.NBest ? result.Recognition.NBest[0].Words : [] : [];

            for (var i = 0; i < returnwords.length; i++) {
                var w = returnwords[i];
                if (words.indexOf(w) == -1) {
                    words.push(w);
                }
            }
//            cb(null, "[" + (parseInt(fileName.split("-")[0]) / 1000 + part * 30) + "s] " + words.join());
            cb(null, "[" + (part * 30) + "s] " + words.join());
        }
    );
    /*var file = options.file;
     var options = {
     host: 'api.att.com',
     port: 443,
     path: '/speech/v3/speechToText',
     method: 'POST',
     headers: {
     'Authorization': "Bearer " + sails.config.CONSTANT.ATT_TOKEN,
     'Accept': "application/json",
     'Content-Type': "audio/x-wav"
     }
     };
     var result = "";

     var request = https.request(options, function (response) {
     response.setEncoding('utf8');
     response.on('data', function (chunk) {
     result += chunk;
     });
     response.on('end', function () {
     try {
     //                console.log(result);
     result = JSON.parse(result);
     if (result.error)
     return cb(result.error);
     if (result.fault)
     return cb(result.fault);
     var text = result.Recognition ? result.Recognition.NBest ? result.Recognition.NBest[0].ResultText : "" : "";
     TextService.filter({'text': text}, function (filteredText) {
     cb(null, filteredText);
     });
     }
     catch (err) {
     sails.log.warn(err);
     cb(err);
     }
     });
     });

     request.on('error', function (e) {
     sails.log.warn('problem with request: ' + e.message);
     cb(e);
     });

     fs.readFile(file, function (err, data) {
     if (err) {
     sails.log.warn(err);
     request.abort();
     cb(err);
     } else {
     // write data to request body
     request.write(data);
     request.end();
     }
     });*/
}

function _getLastFileNumber(path) {
    var files;
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
    } else {
        files = 0;
    }

    return files.length + 1;
}

function _generateSlidePath(slidePath, slidePrefix, slideNumber) {
    var files = fs.readdirSync(slidePath),
        size = files.length > 0 ? files[0].split("-")[1].split(".")[0].length : 6,
        number = slideNumber.toString();

    while (number.length < size) number = "0" + number;

    return {'slidePath': slidePath + sails.config.CONSTANT.SEPERATOR + slidePrefix + '-' + number + '.png',
        'fileNumber': number};
}

function _extractPDFText(options, cb) {
    var sessionId = options.sessionId,
        fileId = parseInt(options.fileId),
        blacklist = sails.config.CONSTANT.FILTER_WORDS;
    var pdf_extract = require('pdf-extract');
    var absolute_path_to_pdf = options.filePath;
    var pdfOptions = {
        type: 'text', // [text/ocr] perform text or ocr to get the text within the scanned image
        ocr_flags: [
            '-psm 1',       // automatically detect page orientation
            '-l dia',       // use a custom language file
            'alphanumeric'  // only output ascii characters
        ]
    };
    console.log("<_extractPDFText> " + sessionId + ", " + absolute_path_to_pdf);

    var processor = pdf_extract(absolute_path_to_pdf, pdfOptions, function (err) {
        if (err) {
            cb(err, null);
        }
    });
    processor.on('page', function (data) {
        var text = data.text,
            textdata = glossary.extract(text),
            returndata = [];

        for (var i = 0; i < textdata.length; i++) {
            // convert it into lowercase singular form
            var word = pluralize(textdata[i].toLowerCase(), 1);
            if (word.length > 1 && blacklist.indexOf(word) == -1 && returndata.indexOf(word) == -1) { // omit all one character long words
                returndata.push(word);
            }
        }
        var stObj = {
            'sessionId': sessionId,
            'fileId': fileId,
            'page': data.index,
            'content': JSON.stringify(returndata)
        };
        SlideText.create(stObj).done(function (err, slideText) {
            if (err) {
                console.log(err);
            }
            //console.log("page: " + slideText.page + ", data: " + slideText.content);
        });
    });
    processor.on('complete', function (data) {
        sails.log.info("pdf text extraction complete");
        cb(null, data.text_pages);
    });
    processor.on('error', function (err) {
        cb(err, null);
    });
}

function _zipFile(options, cb) {
    var spawn = require('child_process').spawn,
        ls = spawn('7z', ['a', '-tzip', options.zipPath].concat(options.fromPath));

    ls.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    ls.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    ls.on('close', function (code) {
        cb(code);
    });
}

function _deleteFolderSync(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + sails.config.CONSTANT.SEPERATOR + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                _deleteFolderSync(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function _deleteTxtFilesSync(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            if (file.split(".")[1] == "txt") {
                var curPath = path + sails.config.CONSTANT.SEPERATOR + file;
                fs.unlinkSync(curPath);
            }
        });
    }
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

function _cleanupSession(req) {
    SessionPage.destroy({'sessionId': req.session.sSessionId}).exec(function (err) {
        if (err) {
            sails.log.warn(err);
        } else {
            sails.log.info("sessionPage for session " + req.session.sKeyPhase + " has been deleted");
        }
    });
    if (req.session.sSessionId) delete req.session.sSessionId;
    if (req.session.sSessionName) delete req.session.sSessionName;
    if (req.session.sKeyPhase) delete req.session.sKeyPhase;
    if (req.session.sRole) delete req.session.sRole;
    if (req.session.sSlidesInfo) delete req.session.sSlidesInfo;
//    if (req.session.sUserId) delete req.session.sUserId;
    if (req.session.sPage) delete req.session.sPage;
}

function _getUTCTime() {
    var date = new Date(),
        utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    return new Date(utc);
}

// returns true if the caller is a mobile phone (not tablet)
// compares the user agent of the caller against a regex
// This regex comes from http://detectmobilebrowsers.com/
function isCallerMobile(req) {
    var ua = req.headers['user-agent'].toLowerCase(),
        isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4));

    return !!isMobile;
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
