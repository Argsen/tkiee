/**
 * EvernoteController
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
var EvernoteClient = require('evernote').Evernote;

module.exports = {

    connect: function (req, res) {
        var client = new EvernoteClient.Client({
            consumerKey: sails.config.CONSTANT.EVERNOTE_KEY,
            consumerSecret: sails.config.CONSTANT.EVERNOTE_SECRET,
            sandbox: sails.config.CONSTANT.EVERNOTE_SANBOX // Optional (default: true)
        });
        req.session.evernote = {};
        client.getRequestToken(sails.config.CONSTANT.EVERNOTE_CALLBACK_URL, function(error, oauthToken, oauthTokenSecret, results) {
            console.log("-----------------------------------------------");
            console.log("call->            : EvernoteController.connect");
            console.log("oauthToken->      : " + oauthToken);
            console.log("oauthTokenSecret->: " + oauthTokenSecret);
            console.log("results->         : " + JSON.stringify(results));
            console.log("-----------------------------------------------");

            // store tokens in the session
            req.session.evernote.oauthToken = oauthToken;
            req.session.evernote.oauthTokenSecret = oauthTokenSecret;

            // and then redirect to client.getAuthorizeUrl(oauthToken)
            res.redirect(client.getAuthorizeUrl(oauthToken));
        });
    },

    callback: function (req, res) {
        var userId = req.session.sUserId || 0,
            client = new EvernoteClient.Client({
            consumerKey: sails.config.CONSTANT.EVERNOTE_KEY,
            consumerSecret: sails.config.CONSTANT.EVERNOTE_SECRET,
            sandbox: sails.config.CONSTANT.EVERNOTE_SANBOX
        });

        client.getAccessToken(
            req.session.evernote.oauthToken,
            req.session.evernote.oauthTokenSecret,
            req.param('oauth_verifier'),
            function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
                if(error) {
                    sails.log.error(error);
                    res.json({'error': error}, 500);
                } else {
                    console.log("-----------------------------------------------");
                    console.log("call->                  : EvernoteController.callback");
                    console.log("oauthAccessToken->      : " + oauthAccessToken);
                    console.log("oauthAccessTokenSecret->: " + oauthAccessTokenSecret);
                    console.log("results->               : " + JSON.stringify(results));
                    console.log("-----------------------------------------------");

                    // store the access token in the database
                    Evernote.findOne({'userId': userId}).exec(function(err, evernote) {
                        if (err) {
                            sails.log.error(err);
                            res.json({'error': err});
                        }

                        if (evernote) {
                            evernote.token = oauthAccessToken;
                            evernote.edam = JSON.stringify(results);
                            evernote.save(function (e) {
                                if (e) sails.log.error(e);

                                res.view();
                            });
                        } else {
                            Evernote.create({'userId': userId, 'token': oauthAccessToken, 'edam': JSON.stringify(results)}).exec(function(e, newevernote) {
                                if (e) sails.log.error(e);

                                res.view();
                            });
                        }

                        if (req.session.evernote) delete req.session.evernote;
                    });
                }
            });
    },

    listnotebook: function (req, res) {
        var userId = req.session.sUserId || 0;
        Evernote.findOne({'userId': userId}).exec(function(err, evernote) {
            if (err) {
                sails.log.error(err);
                return res.json({'error': err});
            }
            if (evernote) {
                var client = new EvernoteClient.Client({token: evernote.token});
                var noteStore = client.getNoteStore();
                noteStore.listNotebooks(function (err, notebooks) {
                    if (err) { // { errorCode: 9, parameter: 'authenticationToken' }
                        console.log(err);
                        return res.json({'error': err});
                    }
                    res.json(notebooks);
                });
            } else {
                return res.json({'error': { errorCode: 9, parameter: 'authenticationToken' } });
            }
        });
    },

    newnotebook: function (req, res) {
        var userId = req.session.sUserId || 0;
        Evernote.findOne({'userId': userId}).exec(function(err, evernote) {
            if (err) {
                sails.log.error(err);
                return res.json({'error': err});
            }
            var client = new EvernoteClient.Client({token: evernote.token});
            var noteStore = client.getNoteStore();

            // Create note object
            var notebook = new EvernoteClient.Notebook();
            notebook.name = req.param('notebook_name') || "Empty";

            // Attempt to create note in Evernote account
            noteStore.createNotebook(notebook, function(err, newnotebook) {
                if (err) {
                    // Something was wrong with the note data
                    // See EDAMErrorCode enumeration for error code explanation
                    // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
                    sails.log.error(err); // { "errorCode": 10, "parameter": "Notebook.name" }
                    res.json(err);
                } else {
                    res.json(newnotebook);
                }
            });
        });
    },

    newnote: function (req, res) {
        var userId = req.session.sUserId || 0;
        Evernote.findOne({'userId': userId}).exec(function(err, evernote) {
            if (err) {
                sails.log.error(err);
                return res.json({'error': err});
            }
            var client = new EvernoteClient.Client({token: evernote.token});
            var noteStore = client.getNoteStore();

            var noteTitle = req.param('note_title') || "Empty",
                noteBody = req.param('note_body') || "",
                notebookGuid = req.param('notebook_guid'),
                nBody = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            nBody += "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">";
            nBody += "<en-note>" + noteBody + "</en-note>";

            // Create note object
            var ourNote = new EvernoteClient.Note();
            ourNote.title = noteTitle;
            ourNote.content = nBody;

            // parentNotebook is optional; if omitted, default notebook is used
            if (notebookGuid) {
                ourNote.notebookGuid = notebookGuid;
            }

            // Attempt to create note in Evernote account
            noteStore.createNote(ourNote, function (err, note) {
                if (err) {
                    // Something was wrong with the note data
                    // See EDAMErrorCode enumeration for error code explanation
                    // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
                    sails.log.error(err);
                    res.json({'error': err});
                } else {
                    res.json(note);
                }
            });
        });
    }
};