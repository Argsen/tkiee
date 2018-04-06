$(function () {
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined" && typeof pageData.session.slides != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){
                pageData.session.currentPage = slideIndex + 1;
                pageData.session.currentFileName = pageData.session.slides[slideIndex].name;
                pageData.session.currentFileId = pageData.session.slides[slideIndex].fileId;
                pageData.session.currentFilePage = pageData.session.slides[slideIndex].page + 1;
                if (pageData.user.preference.control.length > 1) {
            //    if (pageData.user.preference.interactivity.length > 1) {
                    feedbackChart();
                    questionChart();
                    slideTagChart();
                }
            });
            clearInterval(loop);
        }
    }, 30);

	$.ajax({
		type: "GET",
		url: "session/getuploadedfiles",
		dataType: "json",
		cache: false,
		data: {"sessionId": pageData.session.sessionId},
		success: function(response) {
            console.log(response);
			pageData.file = response;
			var filepage = 0,
				slides = [];
			for (var i = 0; i < response.length; i++) {
				if (response[i].type == "pdf") {
					for (var n = filepage; n < filepage + response[i].size; n++) {
						slides[n] = {"name":response[i].name, "page":n - filepage, "fileId": response[i].id, "startPage": filepage};
					}
                    filepage += response[i].size;
				}		
			}
            console.log(slides);
			pageData.session.slides = slides;
		}
	});

    var createChart = function (res) {
        var myBarChart;
        this.add = function (res) {
            var data = {
                labels: ["Speed", "Understandability"],
                datasets: [
                    {
                        fillColor: "rgba(151,187,205,0.5)",
                        strokeColor: "rgba(151,187,205,0.8)",
                        highlightFill: "rgba(151,187,205,0.75)",
                        highlightStroke: "rgba(151,187,205,1)",
                        data: [0,0]
                    }
                ]
            };        
            var options = {
                //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
                scaleBeginAtZero : true,

                //Boolean - Whether grid lines are shown across the chart
                scaleShowGridLines : true,

                //String - Colour of the grid lines
                scaleGridLineColor : "rgba(0,0,0,.05)",

                //Number - Width of the grid lines
                scaleGridLineWidth : 1,

                //Boolean - Whether to show horizontal lines (except X axis)
                scaleShowHorizontalLines: true,

                //Boolean - Whether to show vertical lines (except Y axis)
                scaleShowVerticalLines: true,

                //Boolean - If there is a stroke on each bar
                barShowStroke : true,

                //Number - Pixel width of the bar stroke
                barStrokeWidth : 2,

                //Number - Spacing between each of the X value sets
                barValueSpacing : 5,

                //Number - Spacing between data sets within X values
                barDatasetSpacing : 1,

                //String - A legend template
                legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
            };
            data.labels = res.label;
            data.datasets[0].data = res.data;
            if (typeof myBarChart != "undefined") {
                myBarChart.destroy();
            }
            myBarChart = new Chart(res.Chart).Bar(data, options);
        }
    }
    
    $("#controlItemDisplay").click(function () {
        if ($("#displayArea").is(':visible')) {
            $("#displayArea").hide();
        } else {
            $("#displayArea").css({
                top: $("#slider1_container").position().top,
                left: (window.innerWidth - $("#slider1_container").width())/2 + 100,
                width: $(".slides").width(),
                height: $(".slides").height(),
                zIndex: 9999,
                background: "white"
            });        
        
            $("#displayArea").show();
        }
    });
    
    $("#displayArea").append("<div id=\"displayGeneral\" style=\"height: 100px;\"></div>");
    $("#displayGeneral").append("<div class=\"dashboardGeneral\" id=\"feedbackGeneral\"><p id=\"speedNum\"></p><p id=\"understandabilityNum\"></p></div>");
    $("#displayGeneral").append("<div class=\"dashboardGeneral\" id=\"questionGeneral\"></div>");
    $("#displayGeneral").append("<div class=\"dashboardGeneral\" id=\"referenceGeneral\"></div>");
    $("#displayGeneral").append("<div class=\"dashboardGeneral\" id=\"slideTagGeneral\"></div>");
    
    //-------------------------------------------
    // Feedback settings below
    //-------------------------------------------
    
    if (pageData.user.preference.control.length > 1) {
//    if (pageData.user.preference.interactivity.length > 1) {
//        $("#interactivityAreaFeedback").append("<canvas id=\"FeedbackChart\"></canvas>");    
        $("#displayArea").append("<label for=\"feedbackChart\">FeedBack: </label>");
        $("#displayArea").append("<canvas id=\"feedbackChart\"></canvas>"); 
        
        var ctxFeedback = document.getElementById("feedbackChart").getContext("2d");    
        var speedNum = 0,
            understandabilityNum = 0;
     
        var createFeedbackChart = new createChart({"label": [], "data": [], "Chart": ctxFeedback}); 
        function feedbackChart() {
            speedNum = 0;
            understandabilityNum = 0;        
            $.ajax({
                type: "GET",
                url: "feedback/getInfo",
                dataType: "json",
                cache: false,
                data: {"sessionId": pageData.session.sessionId, "page": pageData.session.currentPage},
                success: function(response) {
                    if (response.error) {
                        createFeedbackChart.add({"label": ["Speed", "Understandability"], "data": [0, 0], "Chart": ctxFeedback});
                    } else {
                        for (var i=0; i<response.length; i++) {
                            if (response[i].feedbackOptionId == 1) {
                                understandabilityNum = response[i].count;
                            } else {
                                speedNum = response[i].count;
                            }                
                        }
                        createFeedbackChart.add({"label": ["Speed", "Understandability"], "data": [speedNum, understandabilityNum], "Chart": ctxFeedback});
                    }
                    $("#speedNum").text("speed: " + speedNum);
                    $("#understandabilityNum").text("Understandability: " + understandabilityNum);                    
                }
            });
        }
    }
    
    //-------------------------------------------
    // Question settings below
    //-------------------------------------------
    
    if (pageData.user.preference.control.length > 1) {    
//    if (pageData.user.preference.interactivity.length > 1) {
//        $("#interactivityAreaQuestion").append("<canvas id=\"QuestionChart\"></canvas>");
        $("#displayArea").append("<label for=\"QuestionChart\">Question: </label>");
        $("#displayArea").append("<canvas id=\"QuestionChart\"></canvas>"); 

        
        var ctxQuestion = document.getElementById("QuestionChart").getContext("2d");        
        
        var createQuestionChart = new createChart({"label": [], "data": [], "Chart": ctxQuestion}); 
        function questionChart() {
            $.ajax({
                type: "GET",
                url: "comment/find",
                dataType: "json",
                cache: false,
                data: {"sessionId": pageData.session.sessionId, "page": pageData.session.currentPage},
                success: function(response) {
                    createQuestionChart.add({"label": ["Page " + pageData.session.currentPage], "data": [response.length], "Chart": ctxQuestion});
                }
            });
        }
    }
    
    //-------------------------------------------
    // Quiz settings below
    //-------------------------------------------

    //-------------------------------------------
    // Evaluation settings below
    //-------------------------------------------

    //-------------------------------------------
    // SlideTag settings below
    //-------------------------------------------
    
    if (pageData.user.preference.control.length > 1) {    
//    if (pageData.user.preference.interactivity.length > 1) {
//        $("#interactivityAreaSlideTag").append("<canvas id=\"SlideTagChart\"></canvas>");   
        $("#displayArea").append("<label for=\"SlideTagChart\">Slide Tag: </label>");
        $("#displayArea").append("<canvas id=\"SlideTagChart\"></canvas>"); 
        
        var ctxSlideTag = document.getElementById("SlideTagChart").getContext("2d");        
        
        var createSlideTagChart = new createChart({"label": [], "data": [], "Chart": ctxSlideTag}); 
        function slideTagChart() {
            $.ajax({
                type: "GET",
                url: "filemodify/getrating",
                dataType: "json",
                cache: false,
                data: {"fileId": pageData.page.id[pageData.session.currentPage - 1]},
                success: function(response) {
                    if (response.error) {
                        createSlideTagChart.add({"label": ["Page " + pageData.session.currentPage], "data": [0], "Chart": ctxSlideTag});
                    } else {
                        createSlideTagChart.add({"label": ["Page " + pageData.session.currentPage], "data": [response.data.tag], "Chart": ctxSlideTag});
                    }
                }			
            });	        
        }
    }

    //-------------------------------------------
    // Reference settings below
    //-------------------------------------------
    
    //-------------------------------------------
    // Distraction settings below
    //-------------------------------------------
    
    //-------------------------------------------
    // Resources settings below
    //-------------------------------------------
    
    $("#ResourcesToolbar").append("<button id=\"exportNote\">Note Export</button>");
    $("#ResourcesToolbar").append("<button id=\"exportQuiz\">Quiz Export</button>");
    $("#ResourcesToolbar").append("<button id=\"preRecordingPlay\">Pre-Recording Play</button>");
    $("#ResourcesToolbar").append("<button id=\"statistics\">Statistics</button>");
    $("#ResourcesToolbar").append("<button id=\"downloadZip\">Download Zip</button>");
    
    $("#exportNote")
        .button()
        .click(function () {
            $.ajax({
                type: "GET",
                url: "Note/export",
                dataType: "json",
                cache: false,
                data: {"id": pageData.user.id, "sessionId": pageData.session.sessionId},
                success: function(response) {
                    var noteExport = "";
                    if (response.error) {
                        alert(response.error);
                    } else {
                        for (var i=0; i < response.length; i++) {
                            noteExport += "Page " + response[i].page + ": " + response[i].content + "\r\n";
                        }
                        var blob = new Blob([noteExport], {type: "text/csv;charset=utf-8;",});
                        saveAs(blob, "Note for " + pageData.session.sessionName +".txt");  							
                    }
                }
            });	
        });
        
    $("#exportQuiz")
        .button()
        .click(function () {
            $.ajax({
                type: "GET",
                url: "Quiz/getfilelist",
                dataType: "json",
                cache: false,
                data: {"sessionId": pageData.session.sessionId},
                success: function(response) {
                    if (response.error) {
                        
                    } else {
                        for (var i = 0; i < response.length; i ++) {
                            exportQuiz(response[i]);
                        }
                    }
                }
            });				
        });
        
    $("#preRecordingPlay")
        .button()
        .click(function () {
            if ($("#recordingPlay").is(':visible')) {
                $("#recordingPlay").hide();
            } else {
                $("#recordingPlay").show();
            }
/*            $.ajax({
                type: "POST",
                url: "session/editorAudioConvert",
                dataType: "json",
                cache: false,
                data: {"sessionId": pageData.session.sessionId, "sessionKey": pageData.session.sessionKey},
                success: function(response) {
                    audioNames = response;
                    getEditorAudio();
                    audioUrl = "http://www.tkiee.com:8080/upload/" + pageData.session.sessionKey + "/recording/editor/" + $("#preRecordingSelect option:selected").val();
                    $("#jquery_jplayer_1").jPlayer("setMedia", {
                        m4a: audioUrl
                    });				
                    $("#dialog-audio").dialog("open"); 
                }
            });	  */
        });
        
    $("#statistics")
        .button()
        .click(function () {
            
        });
        
    $("#downloadZip")
        .button()
        .click(function () {
            
        });
        
/*	function getEditorAudio(){
		$("#preRecordingSelect").empty();
		var n = 1;
		for (var i=0; i<audioNames.length; i++) {
			if (audioNames[i].substring(audioNames[i].lastIndexOf("-")+1, audioNames[i].lastIndexOf(".")) == (currentPage - 1)) {
				$("#preRecordingSelect").append("<option value=\"" + audioNames[i] + "\">Page " + currentPage + " Audio" + n + "</option>");
				n++;
			}
		}
		$("#preRecordingSelect").trigger("change");
	}        */

    function exportQuiz(Obj) {
        $.ajax({
            type: "GET",
            url: "Quiz/export",
            dataType: "json",
            cache: false,
            data: {"sessionId": Obj.sessionId, "fileId": Obj.id},
            success: function(res) {
                var blob = new Blob([JSON.stringify(res.quiz)], {type: "text/plain;charset=utf-8;",});
                var filename = Obj.name.split(".");
                filename.pop();
                filename = filename.join(".");
                saveAs(blob, filename +".txt");  													
            }
        });
    }
    
    $("#interactivityAreaResources").append("<div id=\"recordingPlay\" style=\"display: none;\"></div>");
    $("#recordingPlay").append("<div id=\"jquery_jplayer_1\" class=\"jp-jplayer\"></div>");
    $("#recordingPlay").append("<div id=\"jp_container_1\" class=\"jp-audio\"><div class=\"jp-type-playlist\"></div></div>");
    $(".jp-type-playlist").append("<div class=\"jp-type-single\"><div class=\"jp-gui jp-interface\"><div class=\"jp-controls-holder\"><div class=\"jp-controls\"><button class=\"jp-play\">Play</button><button class=\"jp-stop\">Stop</button></div></div></div></div>");
    $(".jp-type-playlist").append("<div class=\"jp-playlist\"><ul><li>&nbsp;</li></ul></div>");
    
	new jPlayerPlaylist({
		jPlayer: "#jquery_jplayer_1",
		cssSelectorAncestor: "#jp_container_1"
	}, [
		{
			title:"Cro Magnon Man",
			mp3:"http://www.jplayer.org/audio/mp3/TSP-01-Cro_magnon_man.mp3",
			oga:"http://www.jplayer.org/audio/ogg/TSP-01-Cro_magnon_man.ogg"
		},
		{
			title:"Your Face",
			mp3:"http://www.jplayer.org/audio/mp3/TSP-05-Your_face.mp3",
			oga:"http://www.jplayer.org/audio/ogg/TSP-05-Your_face.ogg"
		},
		{
			title:"Cyber Sonnet",
			mp3:"http://www.jplayer.org/audio/mp3/TSP-07-Cybersonnet.mp3",
			oga:"http://www.jplayer.org/audio/ogg/TSP-07-Cybersonnet.ogg"
		},
		{
			title:"Tempered Song",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-01-Tempered-song.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-01-Tempered-song.ogg"
		},
		{
			title:"Hidden",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-02-Hidden.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-02-Hidden.ogg"
		},
		{
			title:"Lentement",
			free:true,
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-03-Lentement.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-03-Lentement.ogg"
		},
		{
			title:"Lismore",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-04-Lismore.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-04-Lismore.ogg"
		},
		{
			title:"The Separation",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-05-The-separation.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-05-The-separation.ogg"
		},
		{
			title:"Beside Me",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-06-Beside-me.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-06-Beside-me.ogg"
		},
		{
			title:"Bubble",
			free:true,
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-07-Bubble.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-07-Bubble.ogg"
		},
		{
			title:"Stirring of a Fool",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-08-Stirring-of-a-fool.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-08-Stirring-of-a-fool.ogg"
		},
		{
			title:"Partir",
			free: true,
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-09-Partir.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-09-Partir.ogg"
		},
		{
			title:"Thin Ice",
			mp3:"http://www.jplayer.org/audio/mp3/Miaow-10-Thin-ice.mp3",
			oga:"http://www.jplayer.org/audio/ogg/Miaow-10-Thin-ice.ogg"
		}
	], {
		swfPath: "../dist/jplayer",
		supplied: "oga, mp3",
		wmode: "window",
		useStateClassSkin: true,
		autoBlur: false,
		smoothPlayBar: true,
		keyEnabled: true
	});
});