/**
 * Global variables
 * Created by ken on 11/07/14.
 */

var kue = require('kue');

module.exports.GLOBAL = {
    JOBS: kue.createQueue({
        prefix: 'q',
        redis: {
            port: 6379,
            host: '127.0.0.1',
//            auth: 'password',
            options: {
                // look for more redis options in [node_redis](https://github.com/mranney/node_redis)
            }
        }
    }).on('job complete', function(id, result){
        kue.Job.get(id, function(err, job){
            if (err) return;
            job.remove(function(err){
                if (err) throw err;
                console.log('removed completed job #%d', job.id);
            });
        });
    })

};