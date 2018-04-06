/**
 * FileModifyController
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

    delete: function(req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
				order = req.param('order') || 0,
				fileId = req.param('fileId');
			
			File.destroy({"sessionId": sessionId, "order": order}).exec(function(err){
				if (err) {
					sails.log.warn(err);
				} else {
					Quiz.destroy({"sessionId" : sessionId, "fileId" : fileId}).exec(function(err){
						if (err) {
							sails.log.warn(err);
						} else {
							SlideNote.destroy({"sessionId" : sessionId, "fileId" : fileId}).exec(function(err){
								if (err) {
									sails.log.warn(err);
								} else {
									SlideText.destroy({"sessionId" : sessionId, "fileId" : fileId}).exec(function(err){
										if (err) {
											sails.log.warn(err);
										} else {
											_getFileListFromDb({'sessionId': sessionId}, function (err, data) {
												if (err) {
													return res.json({'error': err});
												}
												req.session.sSlidesInfo = data;

												//	console.log(session);
												return res.json({'success': 'deleted'});
											});
										}
									});	
								}
							});	
						}
					});					
				}
			});		
		} else {
            sails.log.info("[FileModifyController.delete] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/delete, please use POST method."});			
		}
	},
	
    add: function(req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0;
			
			_getFileListFromDb({'sessionId': sessionId}, function (err, data) {
				if (err) {
					return res.json({'error': err});
				}
				req.session.sSlidesInfo = data;
				//	console.log(session);
				return res.json({'success': 'deleted'});
			});	
		} else {
            sails.log.info("[FileModifyController.delete] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/delete, please use POST method."});			
		}
	},
	
    addUrl: function(req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
				userId = req.param('userId') || req.session.sUserId || 0,
				name = req.param('name'),
				location = req.param('location'),
				type = 'url',
				size = 0,
				order = 0;
				
			var urlObj = {
				'sessionId': sessionId,
				'userId': userId,
				'name': name,
				'location': location,
				'size': size,
				'type': type,
				'order': order
			}
			
			File.create(urlObj).done(function(err, url) {
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create url"});
                } else {
                    return res.json(url);
                }
			});
			
		} else {
            sails.log.info("[FileModifyController.delete] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/delete, please use POST method."});			
		}
	},	
	
    deleteUrl: function(req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
				name = req.param('name'),
				location = req.param('location');
			
			File.destroy({"sessionId": sessionId, 'type': 'url', 'name': name, 'location': location}).exec(function(err){
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot delete url"});
                } else {
                    return res.json({'success': 'deleted'});
                }
			});
			
		} else {
            sails.log.info("[FileModifyController.delete] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/delete, please use POST method."});			
		}
	},	
	
	getInfo: function(req, res) {
		if (req.method === 'GET') {
			var userId = req.param('userId') || req.session.sUserId || 0,
				sessionId = req.param('sessionId') || req.session.sSessionId || 0;
			
			Session.findOne(sessionId).exec(function(err, sessionObj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/getInfo'});
				}
				
				User.findOne(sessionObj.creatorId).exec(function(err, userObj){
					if (err) {
						sails.log.warn(err);
						return res.json({'error': 'error occurred at filemodifycontroller/getInfo'});
					}
					console.log("userObj: " + userObj);
					return res.json({"sessionInfo": sessionObj, "userInfo": userObj});
				});
			});
		}
	},
	
    rating: function(req, res) {
        if (req.method === 'POST') {
            var fileId = req.param('fileId') || 0,
				rating = req.param('rating') || 0,
				info = req.param('info');
				
			var obj = {
				'fileId' : fileId,
				'rating' : rating,
				'info' : info,
				'tag' : 0
			}

			FileRating.findOne({'fileId': fileId}).exec(function(err, fileObj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/rating'});
				}
				
				if (fileObj) {
					FileRating.update(fileObj.id, {'rating': rating, 'info': info}).exec(function(err){
						if (err) {
							sails.log.warn(err);
							return res.json({'error': 'could not change file rating'});
						}
						return res.json({'result': 'success'});					
					});
				} else {
					FileRating.create(obj).done(function(err, file){
						if (err) {
							sails.log.warn(err);
							return res.json({'error': 'could not change file rating'});
						}
						return res.json(file);					
					});
				}
			});
		} else {
            sails.log.info("[FileModifyController.rating] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/rating, please use POST method."});			
		}
	},
	
	getrating: function(req, res) {
		if (req.method === 'GET') {
			var fileId = req.param('fileId') || 0;
			
			FileRating.findOne({'fileId': fileId}).exec(function(err, fileObj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/rating'});
				}
                
				if (fileObj) {
					return res.json({'data': fileObj});
				} else {
					return res.json({'error': "no rating found."})
				}
			});
		} else {
            sails.log.info("[FileModifyController.getrating] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /filemodify/getrating, please use GET method."});			
		}
	},
	
	addtag: function(req, res) {
        if (req.method === 'POST') {
            var userId = req.param('userId') || req.session.sUserId || 0,
				sessionId = req.param('sessionId') || req.session.sSessionId || 0;
				fileId = req.param('fileId') || 0,
				page = req.param('page') || 0,
                activity = req.param('activity') || 0,
                activityNum = 0,
				room = _getRoom(req, res),
                hostRoom = room + '-host';
      
			LogAction.findOne({"activity": activity}).exec(function(err, obj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/addtag'});
				}
                
                activityNum = obj.id;
                
                var logObj = {
                    'userId' : userId,
                    'sessionId' : sessionId,
                    'fileId' : fileId,
                    'page' : page,
                    'action': '{"activity": ' + activityNum + '}'
                }            
                
                Log.create(logObj).exec(function(err, obj){
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': 'error occurred at filemodifycontroller/addtag'});
                    }
                });                
			});      
            
			FileRating.findOne({'fileId': fileId}).exec(function(err, fileObj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/addtag'});
				}
                
                var tagNum = {};
                
				if (fileObj) {
                    tagNum = JSON.parse(fileObj.tag);
                    if (typeof tagNum[activity] === "undefined") {
                        tagNum[activity] = [];
                        tagNum[activity].push(userId);
                    } else {
                        tagNum[activity].push(userId);
                    }
                    FileRating.update(fileObj.id, {'tag': JSON.stringify(tagNum)}).exec(function(err){
                        if (err) {
                            sails.log.warn(err);
                            return res.json({'error': 'could not change file rating'});
                        }
                        sails.io.sockets.in(hostRoom).emit('slideTagReceive', tagNum);
                        return res.json({'result': 'success'});					
                    });
				} else {
                    tagNum[activity] = [];
                    tagNum[activity].push(userId);
					var obj = {
						'fileId': fileId,
						'rating': 0,
						'info': "",
						'tag': JSON.stringify(tagNum)
					}
					FileRating.create(obj).done(function(err, file){
						if (err) {
							sails.log.warn(err);
							return res.json({'error': 'could not change file rating'});
						}
						sails.io.sockets.in(hostRoom).emit('slideTagReceive', file.tag);
						return res.json(file);					
					});
				}
			});
		} else {
            sails.log.info("[FileModifyController.rating] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/rating, please use POST method."});			
		}
	},
    
	deletetag: function(req, res) {
        if (req.method === 'POST') {
            var userId = req.param('userId') || req.session.sUserId || 0,
				sessionId = req.param('sessionId') || req.session.sSessionId || 0;
				fileId = req.param('fileId') || 0,
				page = req.param('page') || 0,
                activity = req.param('activity') || 0,
                activityNum = 0,
				room = _getRoom(req, res),
                hostRoom = room + '-host';
      
			LogAction.findOne({"activity": activity}).exec(function(err, obj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/addtag'});
				}
                
                activityNum = obj.id;
                
                var logObj = {
                    'userId' : userId,
                    'sessionId' : sessionId,
                    'fileId' : fileId,
                    'page' : page,
                    'action': '{"activity": ' + activityNum + '}'
                }            
                
                Log.create(logObj).exec(function(err, obj){
                    if (err) {
                        sails.log.warn(err);
                        return res.json({'error': 'error occurred at filemodifycontroller/addtag'});
                    }
                });                      
			});      
            
			FileRating.findOne({'fileId': fileId}).exec(function(err, fileObj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at filemodifycontroller/addtag'});
				}
                
                var tagNum = {};
                
				if (fileObj) {
                    tagNum = JSON.parse(fileObj.tag);
                    console.log(tagNum[activity.substring(6)]);
                    console.log(userId);
                    if (tagNum[activity.substring(6)]) {
                        var position = tagNum[activity.substring(6)].indexOf(userId);
                            tagNum[activity.substring(6)].splice(position, 1);
                        FileRating.update(fileObj.id, {'tag': JSON.stringify(tagNum)}).exec(function(err){
                            if (err) {
                                sails.log.warn(err);
                                return res.json({'error': 'could not change file rating'});
                            }
                            sails.io.sockets.in(hostRoom).emit('slideTagReceive', tagNum);
                            return res.json({'result': 'success'});					
                        });
                    } else {
                        
                    }
				} else {
                    
				}
			});
		} else {
            sails.log.info("[FileModifyController.rating] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /filemodify/rating, please use POST method."});			
		}
	},

    updatestatus: function(req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
                status = 2;
                
        Session.update(sessionId, {'status': status}).exec(function (err) {
            if (err) {
                sails.log.error(err);
            } else {
                console.log("change session status to " + status);
                return res.json({'result': 'success'});	
            }
        });
        }
    }
};

function _getFileListFromDb(options, cb) {
    File.find({'where': {'sessionId': options.sessionId, 'type': "png"}, 'sort': {'order': 1, 'name': 1}}).exec(function (err, files) {
        if (err) return cb(err);
        else {
            var fileList = [];
			var pngId = [];
            for (var i = 0; i < files.length; i++) {
                fileList.push(files[i].location);
				pngId.push(files[i].id);
            };
            return cb(null, {'pages': fileList.length, 'files': fileList, 'pngId': pngId});
        }
    });
}

function _getRoom(req, res) {
    return req.session.sKeyPhase || req.param('session');

    if (!room) {
        return res.json({'error': 'cannot find session'});
    }
}