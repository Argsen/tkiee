/**
 * SocketController
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

var fs = require("fs"),
    platform = require('platform');
    mkdirp = require('mkdirp');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to SocketController)
     */
    _config: {},

    index: function (req, res) {
        console.log(req.socket);
        var roomNames = JSON.stringify(sails.sockets.socketRooms(req.socket));
        console.log(roomNames);
        return res.json({
            message: 'I am subscribed to: ' + roomNames + ' ' + req.param('message')
        });
    },

    join: function(req, res) {
        var room = _getRoom(req, res),
            hostRoom = room + '-host',
            socket = req.socket;
        var sessionId = req.session.sSessionId || 0,
            userId = req.session.sUserId || 0;

        socket.join(room);
        if (req.session.sRole == 'host') {
            socket.join(hostRoom);
        }
        
        var hostNumber = sails.io.sockets.clients(hostRoom).length,
            participantNumber = {};
            participantNumber.currentParticipant = sails.io.sockets.clients(room).length - hostNumber;
        console.log('a new ' + (req.session.sRole == 'host' ? 'host' : 'client') + ' has joined session ' + room + ', ' +
            hostNumber + ' host' + (hostNumber > 1 ? 's' : '') + ' and ' +
            participantNumber.currentParticipant + ' participant' + (participantNumber.currentParticipant > 1 ? 's' : ''));
		
		Session.findOne({"id": req.session.sSessionId}).exec(function(err, sessionObj){
            if (err) {
			
			} else {
                if (req.session.sRole != 'host' && userId != 0 && userId != sessionObj.creatorId) {
                    UserSession.findOne ({"userId": userId, "sessionId": sessionId}).exec(function (err, Obj) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "cannot find in usersession"});
                        } else {
                            if (!Obj) {
                                UserSession.create({"userId": userId, "sessionId": sessionId}).done(function (err, userSessionObj) {
                                    if (err) {
                                        sails.log.warn(err);
                                        return res.json({'error': "cannot submit in usersession"});
                                    } else {
                                        return res.json({'success': "saved in usersession"});
                                    }
                                });
                            }
                        }
                    });
                }
            
				if (sessionObj && participantNumber.currentParticipant > sessionObj.participant) {
					Session.update(req.session.sSessionId, {"participant": participantNumber.currentParticipant}).exec(function (err) {
						if (err) {
							sails.log.error("<SocketController.join> " + err);
						}
					});
				} else {
                    participantNumber.maxParticipant = sessionObj.participant;
                }
                
                sails.io.sockets.in(hostRoom).emit('participantNumber', participantNumber);

                return res.json({
                    'message': 'session ' + room + ' joined.',
                    'currentParticipant': participantNumber.currentParticipant,
                    'maxParticipant': participantNumber.maxParticipant
                });                
			}
		});
    },

    broadcast: function (req, res) {
        var room = _getRoom(req, res),
            socket = req.socket,
            event = req.param('event'),
            data = req.param('data');

        socket.broadcast.to(room).emit(event, {'data':data});

        console.log('broadcast message ' + event + ' to room ' + room + ' clients with data ' + data);
        return res.json({'event':event,'data':data});
    },

    changepage: function (req, res) {
        var room = _getRoom(req, res),
            socket = req.socket,
            page = req.param('page') || 0,
            sessionId = req.session.sSessionId || 0,
            fileId = req.param('fileId') || 0,
            role = req.session.sRole;

        if (sessionId > 0 && role == 'host') {
            SessionPage.findOne({'sessionId':sessionId}).exec(function(err, sessionpage) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': 'could not access requested sessionpage'});
                }

                if (sessionpage) {
                    sessionpage.page = parseInt(page);
                    sessionpage.save(function(err) {
                        if (err) {
                            sails.log.warn(err);
                        }
                    });
                } else {
                    var spObj = {
                        'sessionId': parseInt(sessionId),
                        'page': parseInt(page)
                    };

                    SessionPage.create(spObj).done(function(err, sp) {
                        if (err) {sails.log.warn(err);}
                    });
                }

                req.session.sPage = page;
                socket.broadcast.to(room).emit('pageSynchronise', {'page':page,'fileId':fileId});
                console.log('broadcast message pageSynchronise to room ' + room + ' clients with data ' + page);
            });
        }

        return res.json({'event':'pageSynchronise','page':page});
    },

    getcurrentpage: function (req, res) {
        var page = req.session.sPage || 0,
            sessionId = req.session.sSessionId || req.param("sessionId") || 0;

        if (sessionId > 0) {
            SessionPage.findOne({'sessionId':sessionId}).exec(function(err, sessionpage) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': 'could not access requested sessionpage'});
                }

                if (sessionpage) {
                    return res.json({'page':sessionpage.page});
                }
                return res.json({'page':0});
            });
        } else {
            return res.json({'msg':'cannot find corresponding sessionpage'});
        }
    },

    test: function(req, res){

//        var room = req.param('roomName');
//        sails.sockets.broadcast(room, 'chat', {msg: 'Hi there!', from: req.session.userId, room: room}, req.socket);

        var room = req.param('session'),
            socket = req.socket;
        console.log(room);
        socket.broadcast.to(room).emit('message', {thisIs: 'theMessage'});

        return res.json({
            message: 'Message sent!'
        });
    },

    record: function(req, res) {
        var data = req.param('audio');
        data.keyPhase = req.session.sKeyPhase || '';

        var room = _getRoom(req, res),
            socket = req.socket;
        socket.broadcast.to(room).emit('audio', data);
        _writeToDisk(room, data);

        return res.json({
            message: 'recording received',
            time: new Date()
        });
    },
	
    startrecord: function(req, res) {
		Session.update(req.session.sSessionId, {"isStreaming": true}).exec(function (err) {
			if (err) {
				sails.log.error("<SocketController.record> " + err);
			}
		});	
		
        return res.json({'result': "success"});
    },	

    stoprecord: function(req, res) {
        var room = _getRoom(req, res);
        StreamService.deleteroom(room);
		
		Session.update(req.session.sSessionId, {"isStreaming": false}).exec(function (err) {
			if (err) {
				sails.log.error("<SocketController.stoprecord> " + err);
			}
		});		
		
        return res.json({'result': "success"});
    },
	
	detectIe: function(req, res) {
        if (_browserCheckforclientm(req.headers['user-agent'])) {
            return res.json({'message': "ie"});
        } else {
            return res.json({'message': "not IE"});
        }
	}
};

function _getRoom(req, res) {
    var room = req.session.sKeyPhase || req.param('session');

    if (!room) {
        return res.json({'error':'cannot find session'});
    }

    return room;
}


function _writeToDisk(room, data) {
    var fileRootNameWithBase = sails.config.CONSTANT.UPLOAD_PATH + sails.config.CONSTANT.SEPERATOR +
        data.keyPhase + sails.config.CONSTANT.SEPERATOR + 'recording';

    // check filePath
    mkdirp(fileRootNameWithBase, function (err) {
        if (err) {
            sails.log.warn(err);
            return res.json({'error': 'could not write file system'});
        }

        var filePath = _generateRecordPath(fileRootNameWithBase, data.timestamp, data.page),
            dataURL = data.dataURL.split(',').pop(),
            fileBuffer = new Buffer(dataURL, 'base64');

        StreamService.write(room, fileBuffer);
        if (fs.existsSync(filePath)) {
            fs.appendFileSync(filePath, fileBuffer);
        } else {
            fs.writeFileSync(filePath, fileBuffer);
        }
    });
}

function _generateRecordPath(recordPath, recordTime, recordPage) {
    var files = fs.readdirSync(recordPath),
        size = files.length > 0 ? files[0].split("-")[0].length : 8,
        number = recordTime.toString();

    while (number.length < size) number = "0" + number;

    return recordPath + sails.config.CONSTANT.SEPERATOR + number + '-' + recordPage + '.wv';
}

function _browserCheckforclientm(agent) {
    var ua = platform.parse(agent);
    return (ua.name.toLowerCase() == "ie");
}