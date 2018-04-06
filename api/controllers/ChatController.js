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
    platform = require('platform'),
    mkdirp = require('mkdirp'),
	groupNum = {};

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to SocketController)
     */
    _config: {},

	split: function(req, res){
        if (req.method === 'POST') {
            var sessionId = req.session.sSessionId,
				participantNumber = req.param('participantNumber'),
				groupNumber = req.param('groupNumber'),
				groupNumber_b = 1;
			
			groupNum[sessionId] = [];
				
			for (var i=0; i<participantNumber; i++) {
				groupNum[sessionId][i] = groupNumber_b;
				if (++groupNumber_b > groupNumber) {
					groupNumber_b = 1;
				}
			}
			
			return res.json('success');
        } else {
            sails.log.info("[ChatController.start] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /chat/split, please use POST method."});
        }
	},
	
	getGroup: function(req, res){
        if (req.method === 'GET') {
            var sessionId = req.session.sSessionId,
				groupNumber = 0;
			
			groupNumber = groupNum[sessionId][0];
			groupNum[sessionId].shift();
			
			return res.json({'groupNumber': groupNumber});			
        } else {
            sails.log.info("[ChatController.start] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /chat/getGroup, please use GET method."});
        }
	},
	
    deletegroup: function(req, res) {
		if (req.method === 'POST') {
			var sessionId = req.session.sSessionId;
			if (groupNum[sessionId]) delete groupNum[sessionId];
			return res.json({'success': "success"});
        } else {
            sails.log.info("[ChatController.start] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /chat/deletegroup, please use POST method."});
        }
    }	
};