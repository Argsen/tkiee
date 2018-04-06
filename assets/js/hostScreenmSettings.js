$(function() {
    //-------------------------------------------
    // general settings below
    //-------------------------------------------
    
    //-------------------------------------------
    // streaming settings below
    //-------------------------------------------
    
    $("#controlItemStreaming").click(function() {
        console.log("streaming");
    });
    
    //-------------------------------------------
    // Filelists settings below
    //-------------------------------------------
    
    //-------------------------------------------
    // speaker note settings below
    //-------------------------------------------

    $("#popupPPTNoteIcon").click(function() {
        $("#popupPPTNote").popup('open');
    });
    
    //-------------------------------------------
    // pointer settings below
    //-------------------------------------------
    
	var screenLock = 0;
	
	$("#openPointer").click(function(){
        if ($("#visualPointerArea").is(':visible')) {
            $("#visualPointerArea").remove();
            socket.post('/socket/broadcast', {'event':'visualPointerStop', 'data':{}}, function(response) {console.log(response);});
            screenLock = 0;            
        } else {
            $("<div id=\"visualPointerArea\"></div>").css({
                position: "absolute",
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                zIndex: 9999
            }).appendTo($("#slider1_container").css("position", "relative"));		
            
            screenLock = 1;
            
            $("#visualPointerArea").on("touchmove", function(e) {	
                var x = e.originalEvent.touches[0].clientX, y = e.originalEvent.touches[0].clientY;
                var rateX = x/$("#visualPointerArea").width(), rateY = y/$("#visualPointerArea").height();
                socket.post('/socket/broadcast', {'event':'visualPointerStart', 'data':{"rateX": rateX, "rateY": rateY}}, function(response) {console.log(response);});
            }); 
        }
	});

	$('body').on("touchmove", function(e){
		if (screenLock == 1) {
			e.preventDefault();
		} else {
			return true;
		}
	});	    

    //-------------------------------------------
    // annotation settings below
    //-------------------------------------------
    
	$("#openCanvas").click(function(){
        if ($("#colors_demo").is(':visible')) {
            $("#colors_demo").hide();
            socket.post('/socket/broadcast', {'event': 'openAnnotation', 'data': {action: "close", page: pageData.session.currentPage}}, function (res) {}); 
        } else {
            $("#colors_demo").show();
            socket.post('/socket/broadcast', {'event': 'openAnnotation', 'data': {action: "open", page: pageData.session.currentPage}}, function (res) {});
        }   
    });

    socket.on('openAnnotation', function (res) {
        initialAnnotation(res.data.page);
        if (res.data.action == "close") {
            $("#colors_demo").hide();
        } else {
            $("#colors_demo").show();
        } 
    });
    
    $("#colors_sketch").bind('touchend', function () {
        setTimeout(function () {
            socket.post('/socket/broadcast', {'event': 'synchronizeAnnotation', 'data': {'action': annotationAction[pageData.session.currentPage], 'height': $("#slider1_container").height(), 'width': $("#slider1_container").width()}}, function (res) {});  
        }, 500);
    });        
    
    socket.on('synchronizeAnnotation', function (res) {
        annotationWidthRate = $("#slider1_container").width() / res.data.width;
        annotationHeightRate = $("#slider1_container").height() / res.data.height;
        annotationAction[pageData.session.currentPage] = res.data.action;
        canvasObj.redraw();
    });        
    
    //-------------------------------------------
    // scanner settings below
    //-------------------------------------------     
    
    //-------------------------------------------
    // feedback settings below
    //-------------------------------------------

    //-------------------------------------------
    // question settings below
    //-------------------------------------------
    
    $("#popupCommentDisplayIcon").click(function() {
        $("#popupCommentDisplay").popup('open');
    });
    
    //-------------------------------------------
    // quiz settings below
    //-------------------------------------------
    
    
    //-------------------------------------------
    // evaluation settings below
    //-------------------------------------------
    
    var evaluationOptions = {};
    
    $.ajax({
		type: "POST",
		url: "evaluation/find",
		dataType: "json",
		cache: false,
		data: {"sessionId": pageData.session.sessionId},
		success: function(response) {
            pageData.evaluation = response;
            for (var i = 0; i < response.length; i++) {
                var evaluationQuestion = JSON.parse(response[i].question);
                evaluationOptions[response[i].id] = response[i];
                if (response[i].options === 0) {
                    evaluationShortAnswer({'id': response[i].id, 'i':i, 'question': evaluationQuestion.question, 'options': 0});
                    evaluationButtonSet({'id': response[i].id, 'i':i, 'question': evaluationQuestion.question, 'options': 0});
                } else {
                    evaluationMultipleChoice({'id': response[i].id, 'i':i, 'question': evaluationQuestion.question, 'options':evaluationQuestion.options});
                    evaluationButtonSet({'id': response[i].id, 'i':i, 'question': evaluationQuestion.question, 'options':evaluationQuestion.options});
                }
                $("#Evaluation").collapsibleset().trigger('create');
            }   
        }
    });
    
	function evaluationShortAnswer(obj){
        $("#Evaluation").append("<div data-role=\"collapsible\" id=\"evaluationQuestion" + obj.id + "\"></div>");
        $("#evaluationQuestion" + obj.id).append("<h3 id=\"evaluation" + obj.id + "\">Evaluation Question</h3>");
		$("#evaluationQuestion" + obj.id).append("<p>" + obj.question + "</p>");
        $("#evaluationQuestion" + obj.id).append("<button class=\"ui-btn ui-btn-inline ui-mini ui-corner-all ui-btn-icon-right ui-icon-action intoPopUp\" style=\"position:relative;right:0px;\" id=\"evaluationQuestionButton" + obj.id + "P\">Display</button>");
	}
	
	function evaluationMultipleChoice(obj){
		$("#Evaluation").append("<div data-role=\"collapsible\" id=\"evaluationQuestion" + obj.id + "\"></div>");
        $("#evaluationQuestion" + obj.id).append("<h3 id=\"evaluation" + obj.id + "\">Evaluation Question</h3>");		
		$("#evaluationQuestion" + obj.id).append("<p>" + obj.question + "</p>");
		evaluationOptions[obj.id]["optionNames"] = [];
		for (var n = 0; n < obj.options.length; n++) {
			$("#evaluationQuestion" + obj.id).append("<input type=\"checkbox\" id=\"evaluation" + obj.id + "Checkbox" + n + "\">" + "<label for=\"evaluation" + obj.id + "Checkbox" + n + "\">" + obj.options[n] + "</label>");
			evaluationOptions[obj.id]["optionNames"][n] = obj.options[n];
			evaluationOptions[obj.id][obj.options[n]] = 0;
		}
		for (var ii = 0; ii < evaluationOptions[obj.id].options; ii++) {
			$("#evaluationQuestion" + obj.id).append("<label id=\"evaluation" + obj.id + "Label" + (ii + 1) + "\">Option" + (ii + 1) + ": " + evaluationOptions[obj.id][obj.options[ii]] + "</label>");
		}
        $("#evaluationQuestion" + obj.id).append("<button class=\"ui-btn ui-btn-inline ui-mini ui-corner-all ui-btn-icon-right ui-icon-action intoPopUp\" style=\"position:relative;right:0px;\" id=\"evaluationQuestionButton" + obj.id + "P\">Display</button>");			
	}

	function evaluationButtonSet(obj){
		$("#evaluationQuestion" + obj.id).collapsible({
			expand:function(){
			//	socket.post('/socket/broadcast', {'event':'quizExpand', 'data':{'id':obj.id,'class':""}}, function(response) {console.log(response);});
			}
		});
		$("#evaluationQuestionButton" + obj.id + "P")
            .click({'id':obj.id,'num': obj.i, 'class': ""}, function(res){
                if ($("#evaluationQuestionButton" + obj.id + "P").text() == "Display") {
                    socket.post('/socket/broadcast', {'event':'evaluationDialog', 'data':{'id':res.data.id,'class':"", "OrC":$("#evaluationQuestionButton" + obj.id + "P").text()}}, function(response) {console.log(response);});
                    $(".intoPopUp").text("Hide");
                } else {
                    socket.post('/socket/broadcast', {'event':'evaluationDialog', 'data':{'id':res.data.id,'class':"", "OrC":$("#evaluationQuestionButton" + obj.id + "P").text()}}, function(response) {console.log(response);});
                    $(".intoPopUp").text("Display");
                }
            });
	}    
    
    $("#evaluationstart").click(function () {
		if (confirm("Start Evaluation?")) {
			$.ajax({
				type: "POST",
				url: "evaluation/start",
				dataType: "json",
				cache: false,
				data: {"sessionId": pageData.session.sessionId},
				success: function(response) {
					
				}
			});
		} else {
			
		}						
    });
    
	socket.on('evaluationDelete', function(res){
		$("#evaluationQuestion" + res.data.evaluationId).remove();
		$("#Evaluation" + res.data.evaluationId).remove();		
	});
    
	socket.on('evaluationEdit', function(response){
        
	});        
 
    //-------------------------------------------
    // grouppower settings below
    //-------------------------------------------

    //-------------------------------------------
    // slidetag settings below
    //-------------------------------------------
    
    $("#slideRatingIcon").click(function () {
        $("#slideRatingDisplay").popup('open');
    });

    //-------------------------------------------
    // reference settings below
    //-------------------------------------------

    //-------------------------------------------
    // note settings below
    //-------------------------------------------

});