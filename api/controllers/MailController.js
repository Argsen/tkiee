/**
 * MailController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
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
var crypto = require('crypto');
 
module.exports = {
    
  


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to OrganizationController)
   */
	_config: {},

	feedback: function(req, res){
		var nodemailer = require('nodemailer');
		var transporter = nodemailer.createTransport({
			host : '',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		});
		
		var name = req.param('name'),
			email = req.param('email'),
			detail = req.param('detail');
		
		var mailOptions = {
			from: '',
			to: '',
			subject: 'user opinion',
			text: 'Name: ' + name + '\n\r' + 'Email: ' + email + '\n\r' + 'Detail: \n\r' + detail
		};  
		
		transporter.sendMail(mailOptions, function (error, response) {
		   if(error){
			   console.log(error);
		   }else{
			 //  console.log("Message sent: " + response.response);
		   }
		   
		   return res.json(response);
		});
	},
	
	getpassword: function(req, res){
		var nodemailer = require('nodemailer');
		var transporter = nodemailer.createTransport({
			host : '',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		});
		if (req.method === 'POST') {
			var email = req.param('email');
			User.findOne({'email': email}).exec(function (err, user) { 
				if (err) {
					sails.log.warn(err);
					return res.json({'error': 'could not find user with this email!'});
				}
				
				if (!user) {
					return res.json({'error': 'could not find user with this email!'});
				}
				
				var mailOptions = {
					from: '',
					to: email,
					subject: 'Password Recovery',
					text: 'User Account: ' + user.email + '\n\r' + 'Password: ' + user.password
				};  
				
				transporter.sendMail(mailOptions, function (error, response) {
				   if(error){
					   console.log(error);
				   }else{
					//   console.log("Message sent: " + response.message);
				   }
				   
				   return res.json(response);
				});			
			});
		} else {
            sails.log.info("[MailController.getpassword] Bad request, please use POST method.");
            return res.json({'error': "Bad request for /mail/getpassword, please use POST method."});
        }
	},

	send: function(req, res) {
		var nodemailer = require('nodemailer');
		var transporter = nodemailer.createTransport({
			host : '',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		});
		
		var email = req.param('email');
			keyPhase = req.param('keyPhase'),
			password = req.param('password'),
			sessionName = req.param('sessionName');
			
		var sha256hash = crypto.createHash('sha256').update(password).digest("hex");
		
		var mailOptions = {
			from: '',
			to: email,
			subject: 'Session: ' + sessionName + ' Link',
			text: 'Desktop: http://www.tkiee.com/hostScreen?keyPhase=' + keyPhase + "-" + sha256hash + "\r\n\r\n" + 'Mobile/Tablet: http://www.tkiee.com/hostScreenm?keyPhase=' + keyPhase + "-" + sha256hash + "\r\n"
		};  
		
		console.log("userEmail: " + email);
		transporter.sendMail(mailOptions, function (error, response) {
		   if(error){
			   console.log(error);
		   }
		   
		   if (response) {
				return res.json(response);
		   } else {
				return res.json({'error': 'mailing error'});
		   }
		});
	}
};
