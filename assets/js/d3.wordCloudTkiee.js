window.onload=  function() {

var unicodePunctuationRe = "!-#%-*,-/:;?@\\[-\\]_{}гд";

var fill = d3.scale.category20b();

var group = "0";

var w = 300,
    h = 300;
	
var words = [],
    max,
    scale = 1,
    complete = 0,
    keyword = "",
    tags,
    fontSize,
    maxLength = 30,
    fetcher;
	
var layout = d3.layout.cloud()
    .timeInterval(10)
    .size([w, h])
    .fontSize(function(d) {return fontSize(+d.value); })
    .text(function(d) {return d.key; })
    .on("end", draw);
	
var svg = d3.select("#vis").append("svg")
	.attr("id", "group0Svg")
    .attr("width", w)
    .attr("height", h);
	
var svg1 = d3.select("#vis1").append("svg")
	.attr("id", "group1Svg")
	.attr("width", w)
	.attr("height", h);
	
var svg2 = d3.select("#vis2").append("svg")
	.attr("id", "group2Svg")
	.attr("width", w)
	.attr("height", h);

var svg3 = d3.select("#vis3").append("svg")
	.attr("id", "group3Svg")
	.attr("width", w)
	.attr("height", h);

var svg4 = d3.select("#vis4").append("svg")
	.attr("id", "group4Svg")
	.attr("width", w)
	.attr("height", h);	

var background = svg.append("g"),
	vis = svg.append("g")
	.attr("id", "group0g")
    .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");	
	
var background1 = svg1.append("g"),
	vis1 = svg1.append("g")
	.attr("id", "group1g")
    .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");	

var background2 = svg2.append("g"),
	vis2 = svg2.append("g")
	.attr("id", "group2g")
    .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");	

var background3 = svg3.append("g"),
	vis3 = svg3.append("g")
	.attr("id", "group3g")
    .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");	

var background4 = svg4.append("g"),
	vis4 = svg4.append("g")
	.attr("id", "group4g")
    .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");		

var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/,
    punctuation = new RegExp("[" + unicodePunctuationRe + "]", "g"),
    wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g,
    discard = /^(@|https?:|\/\/)/,
    htmlTags = /(<[^>]*?>|<script.*?<\/script>|<style.*?<\/style>|<head.*?><\/head>)/g,
    matchTwitter = /^https?:\/\/([^\.]*\.)?twitter\.com/;
	
function generateD3WordCloud (text, groupNum){
	group = groupNum;
	load(text);
}
window.generateD3WordCloud = generateD3WordCloud;

function parseText(text) {
  tags = {};
  var cases = {};
  text.split(wordSeparators).forEach(function(word) {
    if (discard.test(word)) return;
    word = word.replace(punctuation, "");
    if (stopWords.test(word.toLowerCase())) return;
    word = word.substr(0, maxLength);
    cases[word.toLowerCase()] = word;
    tags[word = word.toLowerCase()] = (tags[word] || 0) + 1;
  });
  tags = d3.entries(tags).sort(function(a, b) { return b.value - a.value; });
  tags.forEach(function(d) { d.key = cases[d.key]; });
  var tagsReturn = tags;
  generate();
  return tagsReturn;
}
window.parseText = parseText;

function generate() {
  layout
      .font("Impact");
  fontSize = d3.scale["log"]().range([10, 20]);
  if (tags.length) fontSize.domain([+tags[tags.length - 1].value || 1, +tags[0].value]);
  complete = 0;
  words = [];
  layout.stop().words(tags).start();
}

function draw(data, bounds) {
  scale = bounds ? Math.min(
      w / Math.abs(bounds[1].x - w / 2),
      w / Math.abs(bounds[0].x - w / 2),
      h / Math.abs(bounds[1].y - h / 2),
      h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;
  words = data;
  switch (group) {
	case "0":
		var text = vis.selectAll("text")
				.data(words, function(d) { return d.text.toLowerCase(); });
			break;
	case "1":
		var text = vis1.selectAll("text")
				.data(words, function(d) { return d.text.toLowerCase(); });
			break;	
	case "2":
		var text = vis2.selectAll("text")
				.data(words, function(d) { return d.text.toLowerCase(); });
			break;	
	case "3":
		var text = vis3.selectAll("text")
				.data(words, function(d) { return d.text.toLowerCase(); });
			break;	
	case "4":
		var text = vis4.selectAll("text")
				.data(words, function(d) { return d.text.toLowerCase(); });
			break;	
  }
  
  text.transition()
      .duration(10)
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; });
  text.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; })
      .on("click", function(d) {
        
      })
      .style("opacity", 1e-6)
    .transition()
      .duration(10)
      .style("opacity", 1);
  text.style("font-family", function(d) { return d.font; })
      .style("fill", function(d) { return fill(d.text.toLowerCase()); })
      .text(function(d) { return d.text; });
	var exitGroupNode;	  
  switch (group) {
	case "0":
		  var exitGroup = background.append("g")
			  .attr("transform", vis.attr("transform"));
			  exitGroupNode = exitGroup.node();	  
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup.transition()
      .duration(10)
      .style("opacity", 1e-6)
      .remove();	 			  
			break;
	case "1":
		  var exitGroup1 = background1.append("g")
			  .attr("transform", vis.attr("transform"));
			  exitGroupNode = exitGroup1.node();	
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup1.transition()
      .duration(10)
      .style("opacity", 1e-6)
      .remove();	 			  
			break;	
	case "2":
		  var exitGroup2 = background2.append("g")
			  .attr("transform", vis.attr("transform"));
			  exitGroupNode = exitGroup2.node();	
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup2.transition()
      .duration(10)
      .style("opacity", 1e-6)
      .remove();	 			  
			break;	
	case "3":
		  var exitGroup3 = background3.append("g")
			  .attr("transform", vis.attr("transform"));
			  exitGroupNode = exitGroup3.node();	  
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup3.transition()
      .duration(10)
      .style("opacity", 1e-6)
      .remove();	 
			break;	
	case "4":
		  var exitGroup4 = background4.append("g")
			  .attr("transform", vis.attr("transform"));
			  exitGroupNode = exitGroup4.node();	
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup4.transition()
      .duration(10)
      .style("opacity", 1e-6)
      .remove();	 			  
			break;	
  }	  
 

	vis.transition()
      .delay(10)
      .duration(7)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
	vis1.transition()
      .delay(10)
      .duration(7)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")"); 
	vis2.transition()
      .delay(10)
      .duration(7)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")"); 
	vis3.transition()
      .delay(10)
      .duration(7)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")"); 
	vis4.transition()
      .delay(10)
      .duration(7)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")"); 	  
}

function load(f) {
  fetcher = f;
  if (fetcher) parseText(fetcher);
}

(function() {
  var from,
      to,
      count,
      scale = d3.scale.linear();
 
 getAngles();

  function getAngles() {
	count = +5;
    from = Math.max(-90, Math.min(90, +(-15)));
    to = Math.max(-90, Math.min(90, +(15)));
    update();
  }

  function update() {
    scale.domain([0, count - 1]).range([from, to]);

    layout.rotate(function() {
      return scale(~~(Math.random() * count));
    });
  }

})();
}