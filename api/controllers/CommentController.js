/**
 * CommentController
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

    submit: function(req, res) {
        if (req.method === 'POST') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0,
				userId = req.param('userId') || 0,
				page = req.param('page') || 0,
				content = req.param('content');
				room = _getRoom(req, res),
                hostRoom = room + '-host';
		
		if (sessionId == 0) {return res.json({'error':'a session id should be given'});}
				
		var commentObj = {
			'sessionId' : sessionId,
			'userId' : userId,
			'page' : page,
			'content' : content
		};
		
		Comment.create(commentObj).done(function (err, comment) {
			if (err) {
				sails.log.warn(err);
				return res.json({'error': "cannot submit comment"});
			} else {
				sails.log.info("Comment submitted:", userId);
				sails.io.sockets.in(room).emit('commentReceive', comment);
				return res.json(comment);
			}
		});
		} else {
            sails.log.info("[CommentController.submit] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /comment/submit, please use POST method."});			
		}
	},
	
	find: function(req, res) {
        if (req.method === 'GET') {
            var sessionId = req.param('sessionId') || req.session.sSessionId || 0;
				page = req.param('page') || 0;
            Comment.find({'sessionId': sessionId, 'page': page}).exec(function (err, comment) {
                if (err) return res.json({'error': err});
                if (!comment) return res.json({'error': 'comment not found'});

                return res.json(comment);
            });
        } else {
            sails.log.info("[UserController.find] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /comment/find, please use GET method."});
        }
	}
};

function _getRoom(req, res) {
    return req.session.sKeyPhase || req.param('session');

    if (!room) {
        return res.json({'error': 'cannot find session'});
    }
}
