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

    insert: function (req, res) {
        if (req.method === 'POST') {
			var userId = req.session.sSessionId || req.param("userId") || 0,
				sessionId = req.session.sSessionId || req.param("sessionId") || 0,
				fileId = req.param("fileId") || 0,
				page = req.param("page") || 0,
				activity = req.param("activity") || 0,
				action = req.param("action") || 0;
				
			var obj = {
				'userId' : userId,
				'sessionId' : sessionId,
				'fileId' : fileId,
				'page' : page,
				'action' : {'activity': activity, 'action': action}
			}
		}
    },
	
	getInfo: function (req, res) {
		if (req.method === 'GET') {
			var sessionId = req.session.sSessionId || req.param("sessionId") || 0,
				page = req.param('page');
			
			if (!page){return res.json({'error': 'dashboardcontroller/getInfo no page required'});}
			
			Log.find({"sessionId": sessionId, "page": page}).exec(function(err, session){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'error occurred at dashboardcontroller/getInfo'});
				}
				
				var userId = Array(),
					tagNum = {};
				for (var i = 0; i < session.length; i++) {
					var action = JSON.parse(session[i].action);
					if (action.activity == 6) {
						if (userId.indexOf(session[i].userId) == -1) {
							userId.push(session[i].userId);
						}
						if (tagNum[session[i].page]) {
							tagNum[session[i].page] += 1;
						} else {
							tagNum[session[i].page] = 1;
						}
					}
				}
				
				if (userId.length > 0) {
					User.find().where({"id":userId}).exec(function(err, user){
						if (err) {
							sails.log.warn(err);
							return res.json({'error': 'error occurred at dashboardcontroller/getInfo'});
						}		
						return res.json({"user": user, "num": tagNum});			
					});
				} else {
					return res.json({'error': 'dashboardcontroller/getInfo no user required'});
				}
			});
		}
	}
};
