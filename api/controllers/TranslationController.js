/**
 * TranslationController
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

    translate: function(req, res) {
        if (req.method === 'GET') {
            var word = req.param('word'),
                language = req.param('language');

            var translationObj = {
                'word': word,
                'language': language
            };

            Translation.findOne(translationObj).exec(function(err, trans) {
                if (err) {
                    sails.log.warn(err);
                    return res.json(err);
                }

                if (trans) {
                    return res.json(trans);
                } else {
                    _getTranlation(translationObj, function(err, translation){
                        if (err) {
                            sails.log.warn(err);
                            return res.json(err);
                        }

                        var newTransObj = {
                            'word': word,
                            'language': language,
                            'translation': JSON.stringify(translation)
                        };
                        Translation.create(newTransObj).done(function(err, newTrans) {
                            if (err !== null) {
                                sails.log.warn(err);
                                return res.json({'error':'cannot find translation'});
                            }
                            return res.json(newTrans);
                        });
                    });
                }
            });
		} else {
            sails.log.info("[TranslationController.translate] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /translation/translate, please use GET method."});
		}
	},

    getkeywords: function (req, res) {
        var sessionId = req.session.sSessionId || 0,
            fileId = req.param('fileId') || 0,
            page = req.param('page') || 0,
            blacklist = sails.config.CONSTANT.FILTER_WORDS;

        SlideText.findOne({'sessionId': sessionId, 'fileId': parseInt(fileId), 'page': parseInt(page)}).exec(function (err, slidetext) {
            if (err) {
                sails.log.warn(err);
                return res.json({'error': 'could not access requested session'});
            }

            if (slidetext) {
                var keywords = {},
                    tags = {'tags': []},
                    sorted_keywords = [];
                var slidetextContent = JSON.parse(slidetext.content);
                slidetextContent.sort();
                for (var i = 0; i < slidetextContent.length; i++) {
                    var w = slidetextContent[i],
                        s = slidetextContent[i].substring(0, 1);
                    if (blacklist.indexOf(w) == -1) {
                        if (w in keywords) {
                            keywords[w] += 1;
                        } else {
                            keywords[w] = 1;
                        }
                    }
                }
                for (var key in keywords) {
                    sorted_keywords.push(key);
                }
                for (var i = 0; i < sorted_keywords.length; i++) {
                    var key = sorted_keywords[i],
                        classify = sorted_keywords[i].substring(0, 1)
                    var tag = {'tag': key, 'freq': keywords[key], 'classify': classify};
                    tags.tags.push(tag);
                }

                return res.json(tags);
            } else {
                return res.json({'msg': 'cannot find tags'});
            }
        });
    },
	
	savecustom: function (req, res){
		if (req.method === 'POST') {
			var userId = req.session.sUserId || req.param('userId') || 0,
				sessionId = req.session.sSessionId || req.param('sessionId') || 0,
				organizationId = req.session.sOrganizationId || req.param('organizationId') || 0,
				word = req.param('word'),
				translation = req.param('translation');
			
			var customObj = {
				'userId' : userId,
				'sessionId' : sessionId,
				'organizationId' : organizationId,
				'word' : word,
				'language' : 'custom',
				'translation' : translation
			};
			
			TranslationCustom.findOne({'word': word, "userId": userId}).exec(function(err, Obj){
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'translationcontroller/savecustom'});
				}
				if (Obj) {
					TranslationCustom.update(Obj.id, {'translation': translation}).exec(function(err, customTrans){
						if (err) {
							sails.log.warn(err);
							return res.json({'error': 'translationcontroller/savecustom'});
						}
						if (customTrans.length > 0) {
							return res.json(customTrans[0]);
						} else {
							return res.json({});
						}
					});
				} else {
					TranslationCustom.create(customObj).done(function(err, customTrans){
						if (err) {
							sails.log.warn(err);
							return res.json({'error': 'translationcontroller/savecustom'});
						}
						return res.json(customTrans);	
					});
				}
			});
		}
	},
	
    getcustom: function(req, res) {
        if (req.method === 'GET') {
            var word = req.param('word');

            TranslationCustom.findOne({'word': word}).exec(function(err, trans) {
                if (err) {
                    sails.log.warn(err);
                    return res.json(err);
                }

                if (trans) {
					return res.json(trans);
                } else {
					return res.json({'error': "No custom translation"});
                }
            });
		} else {
            sails.log.info("[TranslationController.translate] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /translation/translate, please use GET method."});
		}
	}
};

function _getTranlation(options, cb) {
    var exec = require('child_process').exec,
        child;
    var language = sails.config.CONSTANT.DICTIONARY_HTTP_PATH + sails.config.CONSTANT.SEPERATOR + options.language,
        word = options.word;

    var command = 'sdcv -n --data-dir "' + language + '" --utf8-output "' + word + '"';

    child = exec(command,
        function (error, stdout, stderr) {
//            console.log('stdout: ' + stdout);
//            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
                return cb(error, null);
            }

            var output = stdout.replace(/[\r\n]/g, "\n").split("\n"),
                returnArray = [];
            if (output.length > 4) {
                for (var i = 4; i < output.length; i++) {
                    var trans = output[i];
                    if (trans.length > 0 && returnArray.indexOf(trans) == -1 && trans.indexOf("-->") == -1) { // remove repeated entries
                        if (options.language == "jpn") trans = trans.replace('[ color="blue">', "").replace('</font>', "").replace(']', "");
                        if (options.language == "en_kor") trans = trans.replace(word + ' ', "");
                        returnArray.push(trans);
                    }
                }
                console.log('exec: ' + returnArray);
            }

            if (returnArray.length > 0) {
                return cb(error, returnArray);
            } else {
                return cb({'error':'cannot find translation of ' + word}, null);
            }
        });
}
