/**
 * NoteController
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
     * (specific to NoteController)
     */
    _config: {},

    submit: function (req, res) {
        if (req.method === 'POST') {
            var sessionId = req.session.sSessionId || req.param('sessionId') || 0,
                userId = req.param('userId') || 0,
                page = req.param('page') || 0,
                content = req.param('content');

            if (userId == 0) {
                return res.json({'error': 'a user id should be given'});
            }

            Note.findOne({'userId': userId, 'page': page, 'sessionId': sessionId}).exec(function (err, note) {
                if (err) return res.json({'error': err});
                if (!note) {
					var noteObj = {
						'sessionId': sessionId,
						'userId': userId,
						'page': page,
						'content': content
					};
					
                    Note.create(noteObj).done(function (err, note) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "cannot submit note"});
                        } else {
                            sails.log.info("Note submitted:", userId);

                            return res.json(note);
                        }
                    });
                } else {
					note.content = content;
                    note.save(function (err) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "cannot submit note"});
                        } else {
                            sails.log.info("Note submitted:", userId);

                            return res.json(note);
                        }
                    });
                }
            });
        } else {
            sails.log.info("[NoteController.submit] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /note/submit, please use POST method."});
        }
    },

    slidenotes: function(req, res) {
        if (req.method === 'GET') {
            var sessionId = req.session.sSessionId || req.param('sessionId') || 0,
                fileId = req.param('fileId') || 0,
                page = req.param('page') || 0;

            var noteObj = {
                'sessionId': sessionId,
                'fileId': fileId,
                'page': page
            };

            SlideNote.findOne(noteObj).exec(function (err, slidenotes) {
                if (err) return res.json({'error': err});

                return res.json(slidenotes);
            });
        } else {
            sails.log.info("[NoteController.slidenotes] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /note/slidenotes, please use GET method."});
        }
    },
	
	slidenoteadd: function(req, res) {
		if (req.method === 'POST') {
            var sessionId = req.session.sSessionId || req.param('sessionId') || 0,
                fileId = req.param('fileId') || 0,
                page = req.param('page') || 0,
				content = req.param('content') || '';
				
            var noteObj = {
                'sessionId': sessionId,
                'fileId': fileId,
                'page': page,
                'content': content
            };
			
            SlideNote.findOne({'sessionId': sessionId, 'fileId': fileId, 'page': page}).exec(function (err, slidenotes) {
                if (err) return res.json({'error': err});
                if (!slidenotes) {
                    SlideNote.create(noteObj).exec(function (err, note) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "cannot submit note"});
                        } else {
                            return res.json(note);
                        }
                    }); 
                } else {
                    SlideNote.update({'sessionId': sessionId, 'fileId': fileId, 'page': page}, {'content': content}).exec(function (err, note) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "cannot submit note"});
                        } else {
                            return res.json(note);
                        }
                    }); 
                }
            });
		} else {
            sails.log.info("[NoteController.slidenoteadd] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /note/slidenoteadd, please use POST method."});
		}
	},
	
    getnotesession: function(req, res) {
        if (req.method === 'GET') {
            var userId = req.session.sUserId || req.param('userId') || 0;
            
			if (userId == 0 || userId == '0') {
                return res.json({'error': 'a user id should be given'});
            }
			
            var noteObj = {
                'userId': userId
            };

            Note.find(noteObj).exec(function (err, notes) {
                if (err) return res.json({'error': err});

                if (notes.length > 0) {
                    var notesSession = [];
                    for (var i = 0; i < notes.length; i++) {
                        var note = notes[i],
                            sessionId = note.sessionId;

                        if (notesSession.indexOf(sessionId) == -1) {
                            notesSession.push(sessionId);
                        }
                    }
					
					Session.find({'id': notesSession}).exec(function(err, sessionList) {
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': "error occurred when trying to get session list"});
                        }
						
                        return res.json({'sessions': sessionList});
                    });
                } else {
                    return res.json({'message': "no sessions found"});
                }
            });
        } else {
            sails.log.info("[NoteController.getnotesession] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /note/getnotesession, please use GET method."});
        }
    },
	
	export: function(req, res){
		if (req.method === 'GET') {
			var userId = req.session.sUserId || req.param('userId') || 0,
				sessionId = req.session.sSessionId || req.param('sessionId') || 0;
			
			if (userId == 0 || userId == '0') {
                return res.json({'error': 'a user id should be given'});
            }
			
            var noteObj = {
                'userId': userId,
				'sessionId': sessionId
            };
			
            Note.find(noteObj).exec(function (err, notes) {
                if (err) return res.json({'error': err});
				
				return res.json(notes);
			});
		} else {
            sails.log.info("[NoteController.export] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /note/export, please use GET method."});
        }
	}
};
