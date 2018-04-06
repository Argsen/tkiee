/**
 * Name: StreamService
 * Description: provide stream services
 * Created by ken on 2/10/14.
 */
var subscribers = {},
    headers = {};

module.exports = {

    write: function(room, stream) {
        if (stream[5] == 0x02) {
            _saveHeader(room, stream);
        }
        if (subscribers[room]) {
            for (var id in subscribers[room]) {
                var cb = subscribers[room][id];
                cb(stream);
            }
        } else {
            subscribers[room] = {};
        }
    },

    subscribe: function(room, id, cb) {
        if (!subscribers[room]) subscribers[room] = {};

        subscribers[room][id] = cb;
    },

    unsubscribe: function(room, id) {
        if (subscribers[room]) {
            if (subscribers[room][id]) delete subscribers[room][id];
            var keys = Object.keys(subscribers[room]);
            if (keys.length == 0) delete subscribers[room];
        }
    },

    deleteroom: function(room) {
        if (subscribers[room]) delete subscribers[room];
        // delete header
        if (headers[room]) delete headers[room];
    },

    getheader: function(room) {
        return headers[room];
    }
};

function _saveHeader(room, stream) {
    var block = 0,
        header = [];
    for (var i = 0; i < stream.length && block < 2; i++) {
        header[i] = stream[i];
        if (stream[i+1] == 0x4f && stream[i+2] == 0x67 && stream[i+3] == 0x67 && stream[i+4] == 0x53) {
            block++;
        }
    }
    headers[room] = new Buffer(header);
}