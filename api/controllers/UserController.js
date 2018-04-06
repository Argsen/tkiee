/**
 * UserController
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
     * (specific to UserController)
     */
    _config: {},

    login: function (req, res) {
        if (req.method === 'POST') {
            var email = req.param('email');
            var password = req.param('password');

            User.findOne({'email': email}).exec(function (err, user) {
				if (err) return res.json({'error': err});
                if (!user) return res.json({'error': 'user not found'});
                if (user.password != password) return res.json({'error': 'password not match'});

                req.session.sUserId = user.id;
                return res.json(user);
            });
        } else {
            sails.log.info("[UserController.login] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /user/login, please use POST method."});
        }
    },

    logout: function (req, res) {
        if (req.method === 'POST') {
            if (req.session.sUserId) delete req.session.sUserId;
            return res.redirect('/login');
        } else {
            sails.log.info("[UserController.logout] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /user/logout, please use POST method."});
        }
    },
	
    logouthome: function (req, res) {
        if (req.method === 'POST') {
            if (req.session.sUserId) delete req.session.sUserId;
            return res.redirect('/home');
        } else {
            sails.log.info("[UserController.logout] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /user/logout, please use POST method."});
        }
    },

    find: function (req, res) {
        if (req.method === 'GET') {
            var userId = req.param('id');
            User.findOne(userId).exec(function (err, user) {
                if (err) return res.json({'error': err});
                if (!user) return res.json({'error': 'user not found'});

                return res.json(user);
            });
        } else {
            sails.log.info("[UserController.find] Bad request, please use GET method.");
            return res.json({'error': "Bad request for /user/find, please use GET method."});
        }
    },

    new: function (req, res) {
        if (req.method === 'POST') {
            var email = req.param('email');
            var password = req.param('password');
            var firstName = req.param('firstName');
            var lastName = req.param('lastName');

            var userObj = {
                'email': email,
                'password': password,
                'firstName': firstName,
                'lastName': lastName,
                'type': 'S01',
                'quota': sails.config.CONSTANT.STORAGE_QUOTA
            };

            User.create(userObj).done(function (err, user) {

                // Error handling
                if (err) {
                    sails.log.warn(err);
                    return res.json({'error': "cannot create user"});

                    // The User was created successfully!
                } else {
                    sails.log.info("User created:", user);

                    return res.json(user);
                }
            });
        } else {
            sails.log.info("[UserController.new] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /user/new, please use POST method."});
        }
    }

};
