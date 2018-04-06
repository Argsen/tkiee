/**
 * Name: TextService
 * Description: provide text processing services
 * Created by ken on 15/08/14.
 */

module.exports = {

    filter: function(params, cb) {
        var text = params.text,
            filterPhrases = sails.config.CONSTANT.FILTER_PHRASES,
            swearWords = sails.config.CONSTANT.FILTER_SWEAR_WORDS;

        // filter phrases
        for (var k = 0; k < filterPhrases.length; k++) {
            text = text.replace(filterPhrases[k], "*");
        }

        // filter words
        var returnText, newText = [];
        for (var i = 0, sentences = text.split("."); i < sentences.length; i++) {
            var newSentences = [];
            for (var j = 0, words = sentences[i].replace(/[^\w\s]|_/g, " ").replace(/\s+/g, " ").split(" "); j < words.length; j++) {
                var word = words[j];
                if (swearWords.indexOf(word.toLowerCase()) == -1) {
                    newSentences.push(word);
                } else {
                    newSentences.push("*");
                }
            }
            newText.push(newSentences.join(" "));
        }
        returnText = newText.join(". ");

        cb(returnText);
    }
};