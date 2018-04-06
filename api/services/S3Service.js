/**
 * Name: S3Service
 * Description: manage Amazon S3 operations
 * Created by ken on 6/08/14.
 */

var fs = require('fs'),
    crypto = require('crypto'),
    AWS = require('aws-sdk');
AWS.config.update({accessKeyId: '', secretAccessKey: ''});
var _uploadPNGKueName = "uploadSlidesPNG";

module.exports = {

    list: function (params, cb) {
        var s3bucket = new AWS.S3();
        s3bucket.listObjects(params, function (err, data) {
            if (err) sails.log.warn(err, err.stack); // an error occurred
            else if (sails.config.environment == 'development') console.log(data); // successful response
            return cb(err, data);
        });
    },

    put: function (params, cb) {
        var s3bucket = new AWS.S3();

        params.Bucket = sails.config.CONSTANT.S3_BUCKET;
        params.ACL = sails.config.CONSTANT.S3_ACL;

        s3bucket.putObject(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else if (sails.config.environment == 'development') console.log(data); // successful response
            return cb(err, data);
        });
    },

    uploadPNG: function (params, cb) {
        var jobs = sails.config.GLOBAL.JOBS,
            _uploadPNGJobName = [_uploadPNGKueName, params.keyPhase].join("-");

        jobs.create(_uploadPNGJobName, params).on('complete', function (result) {
//            sails.log.info(_uploadPNGJobName + " finished ", result);
            cb(null, result);
        }).on('failed', function (err) {
            sails.log.warn({'error': "an error occurred while " + err});
            cb(err);
        }).on('progress', function (progress) {
            console.log('<' + _uploadPNGJobName + '> ' + progress + '% complete');
        }).save(function(err) {
            if (!err) {
                console.log('<' + _uploadPNGJobName + '> job added');
                _process();
            }
        });

        function _process() {
            jobs.process(_uploadPNGJobName, 1, function (job, done) {
                var data = job.data,
                    len = data.filePath.length,
                    finishedUpload = 0,
                    order = data.order;

                function next(i) {
                    if (i == len) {
                        return;
                    } else {
                        var s3bucket = new AWS.S3({'sslEnabled': false}),
                            filepath = data.filePath[i],
                            keyPhase = data.keyPhase,
                            fileNumber = data.fileNumber[i],
                            sessionId = data.sessionId,
                            userId = data.userId;

                        fs.readFile(filepath, function (err, data) {
                            if (err) {
                                sails.log.warn(err);
                            } else {
                                _generateHash({'path': filepath}, function (err, hash) {
                                    if (err) {
                                        sails.log.warn(err);
                                    } else {
                                        var now = new Date(),
                                            stats = fs.statSync(filepath),
                                            pngFileName = ["pdf", now.getFullYear(), ("0" + (now.getMonth() + 1)).slice(-2),
                                                ("0" + now.getDate()).slice(-2), keyPhase, fileNumber, hash.md5].join("-") + ".png";

                                        s3bucket.putObject({
                                            Bucket: sails.config.CONSTANT.S3_BUCKET,
                                            Key: pngFileName,
                                            ACL: sails.config.CONSTANT.S3_ACL,
                                            Body: data,
                                            ContentMD5: hash.base64,
                                            ContentLength: stats["size"],
                                            ContentType: 'image/png'
                                        }, function (err, data) {
                                            if (err) {
                                                sails.log.warn(err);
                                            } else {
//                                                console.log("Successfully uploaded data to S3");
//                                                console.log(data);
                                                File.create({
                                                    'sessionId': sessionId,
                                                    'userId': userId,
                                                    'name': pngFileName,
                                                    'location': sails.config.CONSTANT.S3_BUCKET + '.s3.amazonaws.com/' + pngFileName,
                                                    'size': stats["size"],
                                                    'type': 'png',
                                                    'order': order
                                                }).done(function (err, newFile) {
                                                    if (err) {
                                                        sails.log.warn(err);
                                                    }
                                                    job.progress(finishedUpload++, len);
                                                    if (finishedUpload == len) {
                                                        File.find({'where': {'sessionId': data.sessionId, 'type': "png"}, 'sort': {'order': 1, 'name': 1}}).exec(function(err, files) {
                                                            if (err) done(err);
                                                            else {
                                                                var fileList = [];
                                                                for (var i = 0; i < files.length; i++) {
                                                                    fileList.push(files[i].location);
                                                                }
                                                                done(null, fileList);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    next(i + 1);
                }

                if (len > 0) {
                    next(0);
                } else {
                    File.find({'where': {'sessionId': data.sessionId, 'type': "png"}, 'sort': {'order': 1, 'name': 1}}).exec(function(err, files) {
                        if (err) done(err);
                        else {
                            var fileList = [];
                            for (var i = 0; i < files.length; i++) {
                                fileList.push(files[i].location);
                            }
                            done(null, fileList);
                        }
                    });
                }
            });
        }
    }
};

function _generateHash(options, cb) {
    fs.readFile(options.path, function (err, data) {
        if (err) {
            return cb(err);
        } else {
            var base64 = crypto.createHash('md5').update(data).digest("base64"),
                md5hash = crypto.createHash('md5').update(data).digest("hex"),
                sha256hash = crypto.createHash('sha256').update(data).digest("hex");

            return cb(null, {'base64': base64, 'md5': md5hash, 'sha256': sha256hash});
        }
    });
}