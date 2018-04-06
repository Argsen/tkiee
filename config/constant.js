/**
 * Constant variables
 * Created by ken on 30/05/14.
 */

var os = require('os'),
    fs = require('fs'),
    ifaces = os.networkInterfaces();

module.exports.CONSTANT = {
    S3_KEY: '',
    S3_SECRET: '',
    S3_BUCKET: '',
    S3_ACL: '',

    ATT_ENABLE: true,
    ATT_TOKEN: '', 

    EVERNOTE_KEY: '',
    EVERNOTE_SECRET: '',
    EVERNOTE_SANBOX: true,
    EVERNOTE_CALLBACK_URL: '',

    IS_WINDOWS: os.platform() === 'win32',
    SEPERATOR: os.platform() === 'win32' ? "\\" : '/',
    KEYPHASE_DIGIT: 4,
    UPLOAD_SIZE: 10 * 1024 * 1024,
    STORAGE_QUOTA: 1 * 1024 * 1024 * 1024,

    UPLOAD_PATH: os.platform() === 'win32' ? "" : "",
    SLIDE_NOTE_SCRIPT_PATH: "",
    PPT_TO_PNG_SCRIPT_PATH: "",
    PACKING_SCRIPT_PATH: "",
    PACKING_ADDITIONAL_FILES: ["playlist.m3u", "StartHere.html"],

    MP3SPLT_PATH: os.platform() === 'win32' ? "" : "",

    IP_ADDRESS: getIpAddress(),
    IMAGE_HTTP_PATH: 'http://' + getIpAddress() + (os.platform() === 'win32' ? '' : ':8080') + '/upload',
    DICTIONARY_HTTP_PATH: os.platform() === 'win32' ? '' : '',

    FILTER_WORDS: getBlacklist(),

    FILTER_PHRASES: ['blow job', 'butt plug', 'camel toe', 'dumb ass', 'hard on', 'jerk off', 'jungle bunny', 'nut sack',
        'pissed off', 'porch monkey', 'sand nigger'
    ],

    FILTER_SWEAR_WORDS: ['anus', 'arse', 'arsehole', 'ass', 'ass-hat', 'ass-jabber', 'ass-pirate', 'assbag', 'assbandit',
        'assbanger', 'assbite', 'assclown', 'asscock', 'asscracker', 'asses', 'assface', 'assfuck', 'assfucker', 'assgoblin',
        'asshat', 'asshead', 'asshole', 'asshopper', 'assjacker', 'asslick', 'asslicker', 'assmonkey', 'assmunch', 'assmuncher',
        'assnigger', 'asspirate', 'assshit', 'assshole', 'asssucker', 'asswad', 'asswipe', 'axwound',
        'bampot', 'bastard', 'beaner', 'bitch', 'bitchass', 'bitches', 'bitchtits', 'bitchy', 'blowjob', 'bollocks',
        'bollox', 'boner', 'brotherfucker', 'bullshit', 'bumblefuck', 'butt-pirate', 'buttfucka', 'buttfucker',
        'carpetmuncher', 'chesticle', 'chinc', 'chink', 'choad', 'chode', 'clit', 'clitface', 'clitfuck',
        'clusterfuck', 'cock', 'cockass', 'cockbite', 'cockburger', 'cockface', 'cockfucker', 'cockhead', 'cockjockey',
        'cockknoker', 'cockmaster', 'cockmongler', 'cockmongruel', 'cockmonkey', 'cockmuncher', 'cocknose', 'cocknugget',
        'cockshit', 'cocksmith', 'cocksmoke', 'cocksmoker', 'cocksniffer', 'cocksucker', 'cockwaffle', 'coochie', 'coochy',
        'coon', 'cooter', 'cracker', 'cum', 'cumbubble', 'cumdumpster', 'cumguzzler', 'cumjockey', 'cumslut', 'cumtart',
        'cunnie', 'cunnilingus', 'cunt', 'cuntass', 'cuntface', 'cunthole', 'cuntlicker', 'cuntrag', 'cuntslut',
        'dago', 'damn', 'deggo', 'dick', 'dick-sneeze', 'dickbag', 'dickbeaters', 'dickface', 'dickfuck', 'dickfucker', 'dickhead',
        'dickhole', 'dickjuice', 'dickmilk', 'dickmonger', 'dicks', 'dickslap', 'dicksucker', 'dicksucking', 'dicktickler',
        'dickwad', 'dickweasel', 'dickweed', 'dickwod', 'dike', 'dildo', 'dipshit', 'doochbag', 'dookie', 'douche', 'douche-fag',
        'douchebag', 'douchewaffle', 'dumass', 'dumbass', 'dumbfuck', 'dumbshit', 'dumshit', 'dyke',
        'fag', 'fagbag', 'fagfucker', 'faggit', 'faggot', 'faggotcock', 'fagtard', 'fatass', 'fellatio', 'feltch', 'flamer',
        'fuck', 'fuckass', 'fuckbag', 'fuckboy', 'fuckbrain', 'fuckbutt', 'fuckbutter', 'fucked', 'fucker', 'fuckersucker',
        'fuckface', 'fuckhead', 'fuckhole', 'fuckin', 'fucking', 'fucknut', 'fucknutt', 'fuckoff', 'fucks', 'fuckstick',
        'fucktard', 'fucktart', 'fuckup', 'fuckwad', 'fuckwit', 'fuckwitt', 'fudgepacker',
        'gay', 'gayass', 'gaybob', 'gaydo', 'gayfuck', 'gayfuckist', 'gaylord', 'gaytard', 'gaywad', 'goddamn', 'goddamnit',
        'gooch', 'gook', 'gringo', 'guido',
        'handjob', 'heeb', 'hell', 'ho', 'hoe', 'homo', 'homodumbshit', 'honkey', 'humping',
        'jackass', 'jagoff', 'jap', 'jerk', 'jerkass', 'jigaboo', 'jizz', 'junglebunny',
        'kike', 'kooch', 'kootch', 'kraut', 'kunt', 'kyke',
        'lameass', 'lardass', 'lesbian', 'lesbo', 'lezzie',
        'mcfagget', 'mick', 'minge', 'mothafucka', 'mothafuckin', 'motherfucker', 'motherfucking', 'muff', 'muffdiver', 'munging',
        'negro', 'nigaboo', 'nigga', 'nigger', 'niggers', 'niglet', 'nutsack',
        'paki', 'panooch', 'pecker', 'peckerhead', 'penis', 'penisbanger', 'penisfucker', 'penispuffer', 'piss', 'pissed',
        'pissflaps', 'polesmoker', 'pollock', 'poon', 'poonani', 'poonany', 'poontang', 'porchmonkey', 'prick', 'punanny',
        'punta', 'pussies', 'pussy', 'pussylicking', 'puto',
        'queef', 'queer', 'queerbait', 'queerhole',
        'renob', 'rimjob', 'ruski',
        'sandnigger', 'schlong', 'scrote', 'shit', 'shitass', 'shitbag', 'shitbagger', 'shitbrains', 'shitbreath',
        'shitcanned', 'shitcunt', 'shitdick', 'shitface', 'shitfaced', 'shithead', 'shithole', 'shithouse', 'shitspitter',
        'shitstain', 'shitter', 'shittiest', 'shitting', 'shitty', 'shiz', 'shiznit', 'skank', 'skeet', 'skullfuck', 'slut',
        'slutbag', 'smeg', 'snatch', 'spic', 'spick', 'splooge', 'spook', 'suckass',
        'tard', 'testicle', 'thundercunt', 'tit', 'titfuck', 'tits', 'tittyfuck', 'twat', 'twatlips', 'twats', 'twatwaffle',
        'unclefucker', 'va-j-j', 'vag', 'vagina', 'vajayjay', 'vjayjay',
        'wank', 'wankjob', 'wetback', 'whore', 'whorebag', 'whoreface', 'wop'
    ]

};

function getBlacklist() {
    var path = os.platform() === 'win32' ? "config\\blacklists\\" : "config/blacklists/",
        files = fs.readdirSync(path),
        list = [];
    for (var i = 0; i < files.length; i++) {
        var data = fs.readFileSync(path + files[i], 'utf8'),
            lines = data.split(/\r?\n/);
        list.concat(lines);
    }
    return list;
}

function getIpAddress() {
    for (var dev in ifaces) {
        var iface = ifaces[dev];
        for (var i = 0; i < iface.length; i++) {
            var details = iface[i];
            if (details.family == 'IPv4' && details.address != '127.0.0.1') {
                return details.address;
            }
        }
    }
}