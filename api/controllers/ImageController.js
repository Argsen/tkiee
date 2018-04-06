
/**
 * ImageController (Simple image proxy)
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
var http = require('http');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to ImageController)
     */
    _config: {},

    getimage: function (req, res) {
        var name = req.param('name'),
            options = {
                host: "tkiee.s3.amazonaws.com",
                path: "/" + name
            };

        var callback = function(response) {
            if (response.statusCode === 200) {
                res.writeHead(200, {
                    'Content-Type': response.headers['content-type']
                });
                response.pipe(res);
            } else {
                res.writeHead(response.statusCode);
                res.end();
            }
        };

        http.request(options, callback).end();
    }
};
