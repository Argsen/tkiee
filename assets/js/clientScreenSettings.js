$(function() {
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){          
                pageData.session.currentPage = slideIndex + 1;
                pageData.session.currentFileName = pageData.session.slides[slideIndex].name;
                pageData.session.currentFileId = pageData.session.slides[slideIndex].fileId;
                pageData.session.currentFilePage = pageData.session.slides[slideIndex].page + 1;

                slideRating(slideIndex);
                changeNoteSlide(slideIndex);
                if (slideTag[slideIndex] == 0) {
                    $("#slideTag").show();		
                } else {
                    $("#slideTag").hide();
                }                
                
                if ($("#comboboxLanguage").val() == '') { 

                } else {
                    tagList(slideIndex);
                }
            });
            clearInterval(loop);
        }
    }, 30);
    
    //-------------------------------------------
    // general settings below
    //-------------------------------------------

    socket.on('sessionEnd', function (res) {
        socket.removeAllListeners('disconnect');
        $.ajax({
            type: "GET",
            url: "/logout",
            cache: false,
            success: function(response) {
                alert("This session has been ended! You now have 5 minutes to save your file!");
                setTimeout(function(){window.location.href = '/login';}, 1000*300);
            }
        });
    });    
    
    //-------------------------------------------
    // streaming settings below
    //-------------------------------------------
    
    //-------------------------------------------
    // Filelists settings below
    //-------------------------------------------

    //-------------------------------------------
    // annotation settings below
    //-------------------------------------------
    
    $("#controlItemAnnotation").click(function () {
        if ($("#colors_demo").is(':visible')) {
            $("#colors_demo").hide();
            initialAnnotation(pageData.session.currentPage);
        } else {
            $("#colors_demo").show();
            initialAnnotation(pageData.session.currentPage);
        }   
    });    

    socket.on('openAnnotation', function (res) {
        jssor_slider1.$GoTo(res.data.page - 1);
        initialAnnotation(res.data.page);
        if (res.data.action == "close") {
            $("#colors_demo").hide();
        } else {
            $("#colors_demo").show();
        } 
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
    $("#interactivityAreaFeedback").append("<form></form>");
    $("#interactivityAreaFeedback form").append("<fieldset data-role=\"controlgroup\" data-type=\"horizontal\" id=\"radioUnderstandability\"></fieldset>");
    $("#radioUnderstandability").append("<label>Understandability: </label>");
    $("#radioUnderstandability").append("<input type=\"radio\" name=\"radioUnderstandability\" id=\"radioUnderstandability1\" value=\"0\" checked=\"checked\"><label for=\"radioUnderstandability1\">Yes</label>");
    $("#radioUnderstandability").append("<input type=\"radio\" name=\"radioUnderstandability\" id=\"radioUnderstandability2\" value=\"1\"><label for=\"radioUnderstandability2\">No</label>");
    $("#interactivityAreaFeedback form").append("<fieldset data-role=\"controlgroup\" data-type=\"horizontal\" id=\"radioSpeed\"></fieldset>");
    $("#radioSpeed").append("<label>Speed: </label>");
    $("#radioSpeed").append("<input type=\"radio\" name=\"radioSpeed\" id=\"radioSpeed1\" value=\"0\" checked=\"checked\"><label for=\"radioSpeed1\">Ok</label>");
    $("#radioSpeed").append("<input type=\"radio\" name=\"radioSpeed\" id=\"radioSpeed2\" value=\"1\"><label for=\"radioSpeed2\">Too Fast</label>");    
    
    var feedbackUnderstandability = 0,
        feedbackSpeed = 0;	

    $("#radioUnderstandability")
        .buttonset()
        .change(function(){
            if (feedbackUnderstandability == 0) {
                $.ajax({
                    type: "POST",
                    url: "feedback/submit",
                    dataType: "json",
                    cache: false,
                    data: {"page": pageData.session.currentPage, "feedbackOptionId": "1"},
                    success: function(response) {

                    }
                });
            }
            feedbackUnderstandability = 1;
        });
    
    $("#radioSpeed")
        .buttonset()
        .change(function(){
            if (feedbackSpeed == 0) {
                $.ajax({
                    type: "POST",
                    url: "feedback/submit",
                    dataType: "json",
                    data: {"page": pageData.session.currentPage, "feedbackOptionId": "2"},
                    success: function(response) {

                    }
                });
            }
            feedbackSpeed = 1;
        });
        
    socket.on('pageSynchronise', function(res) {
        opReset();  
    });        
        
    function opReset() {
        $('input[type=radio][name=radioUnderstandability]').button("enable").button("refresh");
        $('input[type=radio][name=radioSpeed]').button("enable").button("refresh");
        $("#radioUnderstandability1").prop( "checked", true ).button("refresh");
        $("#radioUnderstandability2").prop( "checked", false ).button("refresh");
        $("#radioSpeed1").prop( "checked", true ).button("refresh");
        $("#radioSpeed2").prop( "checked", false ).button("refresh");
        feedbackUnderstandability = 0;
        feedbackSpeed = 0;
    }        
    
    //-------------------------------------------
    // question settings below
    //-------------------------------------------    
    
	socket.on('commentReceive', function(res) {
        var li = $("<li style=\"list-style-type: disc;\" class=\"comment comment" + res.page + "\">");
		$("<a>").text(res.content).appendTo(li);
		li.appendTo("#displayQuestion");
        
        notificationDesktop({"name": "Question"});
	});
    
	socket.on('commentDialog', function(res) {
		if (res.data.OrC == 0) {
			$("#dialog-form1").append("<h4>" + res.data.content + "</h4>");
			$("#dialog-form").dialog("open");				
		} else {
			$("#dialog-form").dialog("close");
		}
	});    
    
	$( "#dialog-form" ).on( "dialogopen", function() {
		socket.post('/socket/broadcast', {'event':'commentDialogReturn', 'data':{"OrC": 1}}, function(response) {});
	});
	$( "#dialog-form" ).on( "dialogclose", function() {
		socket.post('/socket/broadcast', {'event':'commentDialogReturn', 'data':{"OrC": 0}}, function(response) {});	
	});
    
    //-------------------------------------------
    // quiz settings below
    //-------------------------------------------
    
    var quizStopSetTimeout = {};
    var quizStopInterval = {};

    $( "#interactivityAreaQuiz" ).append("<div id=\"Quiz\"></div>");
    
    $( "#Quiz" ).height($("#interactivityAreaQuiz").height() - 30);
	$( "#Quiz" ).accordion({
        heightStyle:"content",
		collapsible: true,
		active: false
    });    
    
    socket.on('quizStart', function(res) {
        notificationDesktop({"name": "Quiz"});
        var quizQuestion = JSON.parse(res.quiz.question);
        if ($("#quiz" + res.quiz.id).length) {
            
        } else {
            if (res.quiz.options === 0) {
                $("#Quiz").append("<h3 id=\"quiz" + res.quiz.id + "\">Question for page " + res.quiz.page + "   <b>KeyWord:</b> " + res.quiz.keyword + "</h3>");
                $("#quiz" + res.quiz.id).append("<label id=\"quizQuestionLabel" + res.quiz.id + "T\" style=\"color:red;\"></label>");
                $("#Quiz").append("<div id=\"quizQuestion" + res.quiz.id + "\"><p>" + quizQuestion.question + "</p></div>");
                $("#quizQuestion" + res.quiz.id).append("<textarea id=\"quizTextArea" + res.quiz.id + "\" class=\"ui-corner-all ui-widget-content\" style=\"height:90%;width:90%;padding:5px; font-family:Sans-serif; font-size:1.2em;\"></textarea>")
            } else {
                $("#Quiz").append("<h3 id=\"quiz" + res.quiz.id + "\">Question for page " + res.quiz.page + "   <b>KeyWord:</b> " + res.quiz.keyword + "</h3>");
                $("#quiz" + res.quiz.id).append("<label id=\"quizQuestionLabel" + res.quiz.id + "T\" style=\"color:red;\"></label>");
                $("#Quiz").append("<div id=\"quizQuestion" + res.quiz.id + "\"><p>" + quizQuestion.question + "</p></div>");
                    for (var n = 0; n < quizQuestion.options.length; n++) {
                        $("#quizQuestion" + res.quiz.id).append("<input type=\"checkbox\" name=\"quiz" + res.quiz.id + "Checkbox\" id=\"quiz" + res.quiz.id + "Checkbox" + n + "\">" + "<label for=\"quiz" + res.quiz.id + "Checkbox" + n + "\">" + quizQuestion.options[n] + "</label>");
                    }					
            }  
            $("#Quiz").accordion("refresh");
        }
        
        if (quizStopSetTimeout[res.quiz.id]) {
            clearTimeout(quizStopSetTimeout[res.quiz.id]);
        }
        
        if (quizStopInterval[res.quiz.id]) {
            clearInterval(quizStopInterval[res.quiz.id]);
        }			
        
        if (res.timer != 0) {
            var quizStopTimerCount = res.timer/1000;
            quizStopSetTimeout[res.quiz.id] = setTimeout(function(){
                $.ajax({
                    type: "POST",
                    url: "quiz/stop",
                    dataType: "json",
                    cache: false,
                    data: {"quizId": res.quiz.id},
                    success: function(response) {
                        
                    }
                });	
            }, res.timer);
            quizStopInterval[res.quiz.id] = setInterval(function () {
                if (quizStopTimerCount != 0) {
                    quizStopTimerCount--;
                    $("#quizQuestionLabel" + res.quiz.id + "T").text(quizStopTimerCount + " Secs");
                } else {
                    $("#quizQuestionLabel" + res.quiz.id + "T").text('');
                    clearInterval(quizStopInterval[res.quiz.id]);
                }
            }, 1000);
        }
    });
    
    socket.on('quizStop', function(res){
        if (res.options == 0) {
            $.ajax({
                type: "POST",
                url: "quiz/submit",
                dataType: "json",
                cache: false,
                data: {"quizId": res.id, "answer": $("#quizTextArea" + res.id).val()},
                success: function(response) {
                    
                }
            });
        } else {
            for (var i = 0; i < res.options; i ++) {
                if ($("#quiz" + res.id + "Checkbox" + i).is(':checked')) {
                    $.ajax({
                        type: "POST",
                        url: "quiz/submit",
                        dataType: "json",
                        data: {"quizId": res.id, "answer": $("#quiz" + res.id + "Checkbox" + i).next("label").text()},
                        success: function(response) {
                            
                        }
                    });						
                } 
            }
        }
        $("#Quiz").accordion({active:false});
        $("#quizQuestion" + res.id).remove();
        $("#quiz" + res.id).remove();
    });
    
    //-------------------------------------------
    // evaluation settings below
    //-------------------------------------------
    
    var evaluation = Array();
    
    $("#EvaluationToolbar").append("<button id=\"evaluationSubmit\" style=\"display: inline;\">Submit</button>");
    $( "#interactivityAreaEvaluation" ).append("<div id=\"Evaluation\"></div>");

    $( "#Evaluation" ).height($("#interactivityAreaEvaluation").height() - $("#EvaluationToolbar").height() - 25);
    
    $("#evaluationSubmit")
        .button()
        .click(function () {
            if (confirm("Submit Evaluation?")) {
                for (var i=0; i< evaluation.length; i++) {
                    if (evaluation[i].options == 0) {
                        $.ajax({
                            type: "POST",
                            url: "evaluation/submit",
                            dataType: "json",
                            cache: false,
                            data: {"evaluationId": evaluation[i].id ,"feedback": $("#evaluationTextArea" + evaluation[i].id).val()},
                            success: function(response) {
                                
                            }
                        });						
                    } else {
                        for (var ii = 0; ii < evaluation[i].options; ii ++) {
                            if ($("#evaluation" + evaluation[i].id + "Checkbox" + ii).is(':checked')) {
                                $.ajax({
                                    type: "POST",
                                    url: "evaluation/submit",
                                    dataType: "json",
                                    data: {"evaluationId": evaluation[i].id, "feedback": $("#evaluation" + evaluation[i].id + "Checkbox" + ii).next("label").text()},
                                    success: function(response) {
                                    
                                    }
                                });						
                            } 
                        }							
                    }
                }
            }
        });

    socket.on('evaluationStart', function(res){
        notificationDesktop({"name": "Evaluation"});     
        evaluation = res;
        if (res.length > 0) {
            if (!$.trim( $('#Evaluation').html() ).length) {
                for (var i=0; i < res.length; i ++) {
                    $("#Evaluation").append("<div id=\"Evaluation" + res[i].id + "\"></div>")
                    $("#Evaluation" + res[i].id).append("<h2>" + JSON.parse(res[i].question).question + "</h2>");
                    if (res[i].options == 0) {
                        $("#Evaluation" + res[i].id).append("<textarea id=\"evaluationTextArea" + res[i].id + "\" class=\"ui-corner-all ui-widget-content\" style=\"height:90%;width:90%;padding:5px; font-family:Sans-serif; font-size:1.2em;\"></textarea>")
                    } else {
                        for (var n=0; n < res[i].options; n++) {
                            $("#Evaluation" + res[i].id).append("<input type=\"checkbox\" class=\"evaluationCheckbox" + res[i].id + "\" id=\"evaluation" + res[i].id + "Checkbox" + n + "\"><label for=\"Evaluation" + res[i].id + "Checkbox" + n + "\">" + JSON.parse(res[i].question).options[n] + "</label>");
                        }
                        var $unique = $('input.evaluationCheckbox' + res[i].id);
                        $unique.click({"id": res[i].id}, function(data) {
                            $unique = $('input.evaluationCheckbox' + data.data.id);
                            $unique.filter(':checked').not(this).prop('checked', false);
                        });									
                    }
                }				
            } else {

            }
        } else {
            
        }
    });    
    
    //-------------------------------------------
    // grouppower settings below
    //-------------------------------------------

    var groupNum = 0;

    $("#dialog-grouppower").dialog({
        autoOpen:false,
        height:0.9*$(window).height(),
        width:0.8*$(window).width(),
        modal:false,
        closeOnEscape: true,
        open: function(event, ui) {
            
        },
        close: function(event, ui) {}
    });

    socket.on('chatOpen', function(res) {
        $("#dialog-grouppower").dialog("open").dialogExtend(dialogExtendOptions);
    });
    
    $("#interactivityItemGroupPower")
        .click(function(){
            $("#dialog-grouppower").dialog("open").dialogExtend(dialogExtendOptions);				
        });		
    
    $("#chatTextEnter")
        .button()
        .click(function(){
            $("#chatContent").append("<p>Anonymous: " + $("#chatTextarea").val() + "</p>");
            socket.post('/socket/broadcast', {'event':'chatContentBroadcast', 'data':{"content": $("#chatTextarea").val(), "user": "Anonymous", "group": groupNum}}, function(response) {console.log(response);});
            $("#chatTextarea").val("");
            $("#chatContent").scrollTop($("#chatContent")[0].scrollHeight);
        });

    socket.on('chatContentBroadcast', function(res) {
        if (res.data.group == groupNum) {
            $("#chatContent").append("<p>" + res.data.user + ": " + res.data.content + "</p>");
            $("#chatContent").scrollTop($("#chatContent")[0].scrollHeight);
        }
    });

    socket.on('chatNew', function(res) {
        $("#chatContent").empty();
    });			
    
    socket.on('chatSplit', function(res) {
        $.ajax({
            type: "GET",
            url: "chat/getGroup",
            dataType: "json",
            cache: false,
            data: {},
            success: function(response) {
                console.log("chatSplit: " + response.groupNumber);
                groupNum = response.groupNumber;
            }
        });
    });
    
    //-------------------------------------------
    // slidetag settings below
    //-------------------------------------------
    
    $("#interactivityAreaSlideTag").append("<p>Rate: </p>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideRatingDisplayText1\" style=\"display: block; margin: 10px;\"></div>");
    $("#interactivityAreaSlideTag").append("<p>Hints: </p>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideRatingDisplayText2\" style=\"display: block; margin: 10px;\"></div>");
    $("#interactivityAreaSlideTag").append("<p>Tag This Slide: </p>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideTagME\" style=\"margin-top: 10px;\"><input type=\"radio\" id=\"slideTagME1\" name=\"slideTagME\"><label for=\"slideTagME1\">More Explanation</label><input type=\"radio\" id=\"slideTagME2\" name=\"slideTagME\"><label for=\"slideTagME2\">Cancel</label></div>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideTagAE\" style=\"margin-top: 10px;\"><input type=\"radio\" id=\"slideTagAE1\" name=\"slideTagAE\"><label for=\"slideTagAE1\">Addition Example</label><input type=\"radio\" id=\"slideTagAE2\" name=\"slideTagAE\"><label for=\"slideTagAE2\">Cancel</label></div>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideTagER\" style=\"margin-top: 10px;\"><input type=\"radio\" id=\"slideTagER1\" name=\"slideTagER\"><label for=\"slideTagER1\">Extra Resource</label><input type=\"radio\" id=\"slideTagER2\" name=\"slideTagER\"><label for=\"slideTagER2\">Cancel</label></div>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideTagFR\" style=\"margin-top: 10px;\"><input type=\"radio\" id=\"slideTagFR1\" name=\"slideTagFR\"><label for=\"slideTagFR1\">For My Reminder</label><input type=\"radio\" id=\"slideTagFR2\" name=\"slideTagFR\"><label for=\"slideTagFR2\">Cancel</label></div>");
    
	function slideRating(page){
        $("#slideRatingDisplayText1").empty();
		$("#slideRatingDisplayText2").empty();
        $.ajax({
			type: "GET",
			url: "filemodify/getrating",
			dataType: "json",
			cache: false,
			data: {"fileId": pageData.page.id[page]},
			success: function(response) {
				if (response.data) {
					if (response.data.rating == 0) {
						
					} else if (response.data.rating == 1) {
						$("#slideRatingDisplayText1").append("<a>Important</a>");
					} else {
						$("#slideRatingDisplayText1").append("<a>Very Important</a>");
					}
					if (response.data.info.substring(0, 4) == "http") {
						$("#slideRatingDisplayText2").append("<a href=\"" + response.data.info + "\">" + response.data.info + "</a>");
					} else {
						$("#slideRatingDisplayText2").append("<a>" + response.data.info + "</a>");
					}
                    
                    var string = JSON.parse(response.data.tag);
                    
                    if (isDefined(string.tagME) && string.tagME.indexOf(parseInt(pageData.session.userId)) > -1 ) {
                        $('#slideTagME #slideTagME1').prop('checked', true).button("refresh");
                    } else {
                        $('#slideTagME #slideTagME2').prop('checked', true).button("refresh");          
                    }
                    if (isDefined(string.tagAE) && string.tagAE.indexOf(parseInt(pageData.session.userId)) > -1) {
                        $('#slideTagAE #slideTagAE1').prop('checked', true).button("refresh");
                    } else {
                        $('#slideTagAE #slideTagAE2').prop('checked', true).button("refresh");
                    }         
                    if (isDefined(string.tagER) && string.tagER.indexOf(parseInt(pageData.session.userId)) > -1) {
                        $('#slideTagER #slideTagER1').prop('checked', true).button("refresh");
                    } else {
                        $('#slideTagER #slideTagER2').prop('checked', true).button("refresh");
                    }   
                    if (isDefined(string.tagFR) && string.tagFR.indexOf(parseInt(pageData.session.userId)) > -1) {
                        $('#slideTagFR #slideTagFR1').prop('checked', true).button("refresh");
                    } else {
                        $('#slideTagFR #slideTagFR2').prop('checked', true).button("refresh");
                    }                       
                } else {
                    $('#slideTagME #slideTagME2').prop('checked', true).button("refresh");
                    $('#slideTagAE #slideTagAE2').prop('checked', true).button("refresh");
                    $('#slideTagER #slideTagER2').prop('checked', true).button("refresh");
                    $('#slideTagFR #slideTagFR2').prop('checked', true).button("refresh");
				}				
			}
		});			
	}
    
    function isDefined(data) {
        return typeof data !== "undefined" && data !== null && data !== "" && (Object.prototype.toString.call(data) === "[object Array]" && data.length > 0);   
    }
    
	var slideTag = Array();
	for (var i=0; i<pageData.session.totalPage; i++) {
		slideTag[i] = {};
	}

	$("#slideTagME").buttonset(); 
    $("#slideTagME1").click(function(){
        addTag("tagME");	
    });
    $("#slideTagME2").click(function(){
        deleteTag("canceltagME");
    });    
        
	$("#slideTagAE").buttonset();
    $("#slideTagAE1").click(function(){
        addTag("tagAE");
    });
    $("#slideTagAE2").click(function(){
        deleteTag("canceltagAE");
    });    

	$("#slideTagER").buttonset();
    $("#slideTagER1").click(function(){
        addTag("tagER");
    });
    $("#slideTagER2").click(function(){
        deleteTag("canceltagER");
    });    

	$("#slideTagFR").buttonset();
    $("#slideTagFR1").click(function(){
        addTag("tagFR");
    });    
    $("#slideTagFR2").click(function(){
        deleteTag("canceltagFR");
    });     

    socket.on('slideRating', function (response) {
        slideRating(pageData.session.currentPage - 1);
    });
    
    function addTag(activity) {
        $.ajax({
            type: "POST",
            url: "filemodify/addtag",
            dataType: "json",
            cache: false,
            data: {"sessionId": pageData.session.sessionId, "fileId": pageData.page.id[pageData.session.currentPage - 1], "page": (pageData.session.currentPage -1), "activity": activity},
            success: function(response) {
                alert("Success");
                slideTag[pageData.session.currentPage - 1][activity] = 1;
            }
        });	
    }
    
    function deleteTag(activity) {
        $.ajax({
            type: "POST",
            url: "filemodify/deletetag",
            dataType: "json",
            cache: false,
            data: {"sessionId": pageData.session.sessionId, "fileId": pageData.page.id[pageData.session.currentPage - 1], "page": (pageData.session.currentPage -1), "activity": activity},
            success: function(response) {
                alert("Success");
                slideTag[pageData.session.currentPage - 1][activity] = 1;
            }
        });	
    }    
    
    function getTagS() {
        $.ajax({
            type: "POST",
            url: "filemodify/deletetag",
            dataType: "json",
            cache: false,
            data: {"sessionId": pageData.session.sessionId, "fileId": pageData.page.id[pageData.session.currentPage - 1], "page": (pageData.session.currentPage -1), "activity": activity},
            success: function(response) {
                alert("Success");
                slideTag[pageData.session.currentPage - 1][activity] = 1;
            }
        });	
    }
        
    //-------------------------------------------
    // reference settings below
    //-------------------------------------------
    
    var tagTranslateExport = "";
    
    socket.on('sentFileId', function(response) { 
        fileId = response.data.fileId;
        filePage = response.data.filePage + 1;
    });
    
    $("#comboboxLanguage")
            .change(function(){
                tagList(pageData.session.currentPage - 1);
            });    

    function tagList(page) {
        $.ajax({
            type: "POST",
            url: "translation/getkeywords",
            dataType: "json",
            cache: false,
            data: {"fileId": pageData.session.currentFileId, "page": pageData.session.currentFilePage},
            success: function(response) {
                if (response.msg) {
                
                } else{		
                //    $("#tagList" + page).empty();
                //    $("#tagList" + page).remove();
                    $("#referenceArea").empty();
                    $("#referenceArea").append("<ul class=\"tagList tagList" + page + "\" id=\"tagList" + page + "\"></ul>");						
                    $.each(response.tags, function(i, val) {
                        if (/^[a-zA-Z ]+$/.test(val.tag)) {
                            var tagTranslation = '';
                            var li = $("<li class=\"tag-" + val.classify + "\" id=" + page + "Page" + i + ">"),
                                label = $("<label style=\"font-size:120%;margin-left:5px;\" id=\"label" + page + "Page" + i + "\" for=" + page + "Page" + i + "\">");
                                labelCustom = $("<label style=\"font-size:120%;margin-left:5px;\" id=\"customTranslationLabelCustom" + page + "Page" + i + "\">");
                            $("<a style=\"font-size:120%;margin-left:2px;color:#000099;\">").text(val.tag).appendTo(li);
                            li.appendTo("#tagList" + page);
                            labelCustom.appendTo("#tagList" + page);
                            label.appendTo("#tagList" + page);
                            li.click({'word':val.tag,'language': $("#comboboxLanguage").val()}, function(res){
                                if ($("#label" + page + "Page" + i).text() == '') {
                                    $.ajax({
                                        type: "GET",
                                        url: "translation/translate",
                                        dataType: "json",
                                        data: {"word": res.data.word, "language": res.data.language},
                                        success: function (response) {
                                            if (response.error) {
                                                $("#label" + page + "Page" + i).show();
                                                $("#label" + page + "Page" + i).append("<a>" + $("#comboboxLanguage option:selected").text() + ": Not available</a>");
                                            } else {
                                                tagTranslation = JSON.parse(response.translation).join(",");
                                                $("#label" + page + "Page" + i).show();
                                                $("#label" + page + "Page" + i).append("<a>" + $("#comboboxLanguage option:selected").text() + ": " + tagTranslation + "</a>");
                                                tagTranslateExport += $("#comboboxLanguage option:selected").text() + ": \r\n[" + res.data.word + "] : " + tagTranslation + " \r\n";
                                            }
                                        }
                                    });
                                    $.ajax({
                                        type: "GET",
                                        url: "translation/getcustom",
                                        dataType: "json",
                                        data: {"word": res.data.word},
                                        success: function (response) {
                                            if (response.error) {
                                                
                                            } else {
                                                $("#customTranslationLabelCustom" + page + "Page" + i).append("<a>Custom: " + response.translation + "</a>");
                                                tagTranslateExport += "Custom: \r\n[" + res.data.word + "] : " + response.translation + " \r\n";
                                            }
                                            $("#customTranslationLabelCustom" + page + "Page" + i).show();											
                                        }
                                    });											
                                } else {
                                    
                                }
                                if ($("#label" + page + "Page" + i).is(':hidden') === true) {
                                    $("#label" + page + "Page" + i).show();
                                } else {
                                    $("#label" + page + "Page" + i).hide();
                                }										
                            });
                        } else {
                        
                        }
                    });
                }					
            }
        });				
    }

    //-------------------------------------------
    // note settings below
    //-------------------------------------------
    
    var noteTimeout,
        noteStart = 0,
        noteCurrentPage = [],
        notePngId = Array();

    $("#NoteToolbar").append("<button id=\"exportNoteToWord\" style=\"display: inline;\"></button>");
    $("#NoteToolbar").append("<button id=\"exportNoteToEverN\" style=\"display: inline;\"></button>");    
    
    $("#interactivityAreaNote").append("<div><img id=\"noteSlideArea\"></img></textarea>");
    $("#interactivityAreaNote").append("<textarea id=\"noteTextArea\"></textarea>");
    $("#interactivityAreaNote").append("<button id=\"noteSubmit\">Submit</button>");
    
    function changeNoteSlide(page) {
        $("#noteSlideArea").prop('src', pageData.page.image[page]);
    }
    
    $("#noteTextArea").on('keydown', function() {
        clearTimeout(noteTimeout);
        if (noteStart == 0) {
            if (noteCurrentPage[pageData.session.currentPage - 1] != 1) {
                $('#noteTextArea').val($('#noteTextArea').val()+ "\r\n#" + pageData.session.currentPage + "#\r\n");	
                noteCurrentPage[pageData.session.currentPage - 1] = 1;
            }			
            noteStart = 1;
        } else {
            noteTimeout = setTimeout(function(){
                noteStart = 0;
            }, 1000*20)
        }
    });			    
    
    $("#noteSubmit")
        .button()
        .click(function(){
            if (pageData.session.userId == "undefined" || pageData.session.userId == 0) {
                alert("Anonymous user cannot save notes.");
            } else {
                if ($("#noteTextArea").val() != ''){
                    $.ajax({
                        type: "POST",
                        url: "note/submit",
                        dataType: "json",
                        cache: false,
                        data: {"page": pageData.session.currentPage, "content": $("#noteTextArea").val(), "userId": pageData.session.userId, "sessionId": pageData.session.sessionId},
                        success: function(response) {
                            alert("Note Saved!");
                        }
                    });
                } else {
                    alert("Please Enter Note Before Save!");
                }
            }
        });    
    
    $("#exportNoteToWord")
        .button({text: false, label: 'Export to Word',icons:{primary:"ui-icon-folder-open"}})
        .click(function(){
            var a = $("#noteTextArea").val() + " \r\n\r\n" + tagTranslateExport;
            var blob = new Blob([a], {
            type: "text/plain",
            });
            saveAs(blob, "Note for <%= req.session.sSessionName %>.rtf");   
        });
            
    $("#exportNoteToEverN")
        .button({text: false, label: 'Export to EverNote',icons:{primary:"ui-icon-extlink"}})
        .click(evernoteListNoteBook);
    
    window.evernoteCallback = function () {
        evernoteListNoteBook();
    }
    
    function evernoteListNoteBook(){
        $.ajax({
            type: "POST",
            url: "evernote/listnotebook",
            dataType: "json",
            cache: false,
            data: {},
            success: function(response) {
                console.log("response: " + response);
                if (response.error) {
                    window.open("/evernote/connect");
                } else {
                    for (var i=0; i<response.length; i++) {
                        $("#everNoteSelect").append("<option value=\"" + response[i].guid + "\">" + response[i].name + "</option>");
                    }
                    $("#dialog-exportEverNote").dialog("open");
                }
            }
        });
    }
    
    $("#dialog-exportEverNote").dialog({
        autoOpen:false,
        height:300,
        width:300,
        modal:false,
        close: function(){
            $("#everNoteSelect").empty();
        },
        buttons: {
            "Ok": function(){
                if ($("#noteTitle").val() == '') {
                    alert("Enter Note Title!");
                } else {
                    var noteBody = $("#noteTextArea").val();	
                    
                    for (var i=0; i<pageData.session.totalPage; i++) {
                        var a = $(".slideImgArea[debug-id='slide-" + i +"'] img").attr("src");
                        noteBody = noteBody.replace("#" + (i+1) + "#", "<br />#" + (i+1) + "#<br /><img src=\"" + a + "\"></img><br />");
                    }  
                    
                    tagTranslateExport = tagTranslateExport.replace(/[\r\n]/g, "<br />");

                    $.ajax({
                        type: "POST",
                        url: "evernote/newnote",
                        dataType: "json",
                        cache: false,
                        data: {"note_title": $("#noteTitle").val(), "note_body": noteBody + " <br />" + tagTranslateExport, "notebook_guid": $("#everNoteSelect option:selected").val()},
                        success: function(response) {
                            alert("Export Success!");
                        }
                    });
                    $("#dialog-exportEverNote").dialog("close");
                }
            }
        }
    });
});