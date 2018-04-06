/**
 * PagesController
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
    platform = require('platform'),
	crypto = require('crypto'),
    _browserNotSupportedText = "Sorry, your browser is not supported. Please update your browser to the latest version of:<br />" +
        "<b>Firefox</b> [<a href=\"https://www.mozilla.org/firefox/\">Download</a>]&nbsp;&nbsp;&nbsp;&nbsp;" +
        "<b>Chrome</b> [<a href=\"https://www.google.com/chrome/\">Download</a>]&nbsp;&nbsp;&nbsp;&nbsp;" +
        "<b>IE</b> [<a href=\"https://www.microsoft.com/en-us/download/internet-explorer.aspx\">Download</a>]";

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to QuizController)
     */
    _config: {},
	
    home: function(req, res) {
        if (_browserCheck(req.headers['user-agent'])) {
            return res.send(_browserNotSupportedText);
        }
        return res.view();
    },	

    login: function(req, res) {
        if (_browserCheck(req.headers['user-agent'])) {
            return res.send(_browserNotSupportedText);
        }
        return res.view();
    },

    hostScreen: function(req, res) {
        _directLogin(req, function (err, password) {
            if (err) {
                sails.log.warn(err);
            }

            if (password && password.length > 0) return res.redirect('/hostScreen');
            if (!req.session.sSessionId || req.session.sRole != 'host') return res.redirect('/login');
            return res.view();
        });		
    },

    hostScreenM: function(req, res) {
        _directLogin(req, function (err, password) {
            if (err) {
                sails.log.warn(err);
            }

            if (password && password.length > 0) return res.redirect('/hostScreenM');
            if (!req.session.sSessionId || req.session.sRole != 'host') return res.redirect('/login');
            return res.view();
        });		
    },

    clientScreen: function(req, res) {
        _directLogin(req, function (err) {
            if (err) {
                sails.log.warn(err);
            }

            if (!req.session.sSessionId) return res.redirect('/login');
            return res.view();
        });
    },

    clientScreenM: function(req, res) {
        _directLogin(req, function (err) {
            if (err) {
                sails.log.warn(err);
            }

            if (!req.session.sSessionId) return res.redirect('/login');
            return res.view();
        });
    },

    logout: function(req, res) {
        _cleanupSession(req);
//        return res.redirect('/login');
        return res.json({'message': "logout successfully"});
    },

    stream: function(req, res) {
        //if (!req.session.sSessionId) return res.redirect('/login');

        var room = req.param('room'),
            sessionId = req.session.id;
        res.setHeader("Content-Type", "audio/ogg; codecs=opus");
        res.writeHead(200);
        var firstrequest = true;

        StreamService.subscribe(room, sessionId, function(stream) {
            var newStream = stream;

            // clear this callback if connection destroyed
            if (req.client && req.client.destroyed) {
                StreamService.unsubscribe(room, sessionId);
                return;
            }
            if (firstrequest) {
                if (stream[5] == 0x00) {
                    var header = StreamService.getheader(room);
                    newStream = Buffer.concat([header, stream], header.length + stream.length);
                }
                firstrequest = false;
            }
//            var output = "";
//            for (var i = 0; i < newStream.length; i++) {
//                output += newStream.readUInt8(i).toString(16) + " ";
//            }
//            console.log(output);
            res.write(newStream);
        });
    },
    
    dashboard: function(req, res) {
        return res.view();
    },
    
    test: function (req, res) {
        return res.view();
    }
};

function _directLogin(req, cb) {
    var string = req.param('keyPhase'),
		parts = [],
		keyPhase = '',
		password = '';
		
	if (string) {
		string = string.split("-");
		for(var i=0; i<string.length; i++) {
			parts.push(string[i]);  
		}
		keyPhase = parts[0];
		password = parts[1];
	}

    if (keyPhase) {
        Session.findOne({'keyPhase': keyPhase, 'status': 2}).exec(function (err, session) {
            if (err) {
                sails.log.warn(err);
                cb(err);
            }
            if (session) {
				var sha256hash = crypto.createHash('sha256').update(session.password).digest("hex");
                req.session.sSessionId = session.id;
                req.session.sSessionName = session.name;
                req.session.sKeyPhase = keyPhase;
                req.session.sRole = 'participant';
				if (password == sha256hash) {
					req.session.sRole = 'host';
					req.session.sPage = 0;
				}
				console.log("session.password: " + session.password);

                _getFileListFromDb({'sessionId': session.id}, function (err, data) {
                    if (err) {
                        sails.log.warn(err);
                        cb(err);
                    }
                    req.session.sSlidesInfo = data;

                    cb(null, password);
                });
            } else {
                cb(null);
            }
        });
    } else {
        cb(null);
    }
}

function _getFileListFromDb(options, cb) {
    File.find({'where': {'sessionId': options.sessionId, 'type': "png"}, 'sort': 'name ASC'}).exec(function(err, files) {
        if (err) return cb(err);
        else {
            var fileList = [],
				pngId = [];
            for (var i = 0; i < files.length; i++) {
                fileList.push(files[i].location);
				pngId.push(files[i].id);
            }
            return cb(null, {'pages': fileList.length, 'files': fileList, 'pngId': pngId});
        }
    });
}

function _browserCheck(agent) {
    var ua = platform.parse(agent);
    return (ua.name && ua.name.toLowerCase() == "ie" && parseFloat(ua.version) < 10);
}

function _cleanupSession(req) {
    if (req.session.sSessionId) delete req.session.sSessionId;
    if (req.session.sSessionName) delete req.session.sSessionName;
    if (req.session.sKeyPhase) delete req.session.sKeyPhase;
    if (req.session.sRole) delete req.session.sRole;
    if (req.session.sSlidesInfo) delete req.session.sSlidesInfo;
//    if (req.session.sUserId) delete req.session.sUserId;
    if (req.session.sPage) delete req.session.sPage;
}