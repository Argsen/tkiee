$(function() {
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){          
                pageData.session.currentPage = slideIndex + 1;
                pageData.session.currentFileName = pageData.session.slides[slideIndex].name;
                pageData.session.currentFileId = pageData.session.slides[slideIndex].fileId;
                pageData.session.currentFilePage = pageData.session.slides[slideIndex].page + 1;

                //getDashboardInfo();
                speakerNote();
                slideRating();
                tagList(slideIndex);
                
                _page = slideIndex;
                if (_isRecording) {
                    JsMain.changePage(_page, _pre);
                }
                
                $("#interactivityNotificationFeedback").hide();
                $("#interactivityNotificationFeedback").text('');
                $(".thumbdown").hide();
                $(".thumbup").show();
                
                if (control) {
                    socket.post('/socket/changepage', {'event':'pageSynchronise','page':slideIndex, 'fileId':pageData.session.slides[slideIndex].fileId}, function(response) {});
                } else {
                    control = true;
                }
                
                showHideQuiz();
            });
            clearInterval(loop);
        }
    }, 30);  

    //-------------------------------------------
    // general settings below
    //-------------------------------------------

    $("#controlItemSwitchtoMobile").click(function () {
        window.location.href = self.location + 'm';
    });
    
    $("#controlItemEndSession").click(function () {
        $("#dialog-SessionEnd").dialog("open");
        $("#dialog-SessionEndArea").append("<p>Once the session is ended. The downloadable resources including recordings will be generated. You can visit the completed session under session list to retrieve the files once the link becomes available. An email alert will be sent to the registered users.</p>")						
    });
    
	$("#dialog-SessionEnd").dialog({
		autoOpen:false,
		height:300,
		width:600,
		modal:true,
		closeOnEscape: false,
		open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },
		close: function(event, ui) {$("#dialog-SessionEndArea").empty();$(".ui-dialog-titlebar-close").show();},
		buttons: {
			"Accept": function() {			
				$.ajax({
					type: "POST",
					url: "session/changestatus",
					dataType: "json",
					cache: false,
					data: {"status": 3},
					success: function(response) {
						if (response.result == 'success') {
							$.ajax({
								type: "GET",
								url: "statistic/getData",
								dataType: "json",
								cache: false,
								data: {"sessionId": pageData.session.sessionId},
								success: function(response) {
									$.ajax({
										type: "GET",
										url: "evaluation/getData",
										dataType: "json",
										cache: false,
										data: {"sessionId": pageData.session.sessionId},
										success: function(res) {
											var x = $('<form></form>');
											x.attr('action', '/session/end');
											x.attr('method', 'POST');
											x.appendTo('body');
											x.submit();													
										}
									});	
								}
							});							
						} else {
							
						}
					}
				});				
			},
			Reject: function() {
				$("#dialog-SessionEnd").dialog("close");	
			}
		}			
	});  	    
    
    socket.on('pageSynchronise', function(res) {
        control = false;
    });
    
	socket.on('participantNumber', function(response){
		pageData.session.currentParticipant = response;
	});
    
    socket.on('getFileId', function() {
		socket.post('/socket/broadcast', {'event':'sentFileId', 'data':{'fileId':pageData.session.slides[pageData.session.currentPage - 1].fileId, 'filePage':pageData.session.slides[pageData.session.currentPage - 1].page}}, function(response) {console.log(response);});
	});
    
	socket.on('openUrl', function(res) {
		if (res.data.location.substring(0, 4) == "http") {
			window.open(res.data.location);
		} else {
			window.open("http://" + res.data.location);
		}
	});    

    //-------------------------------------------
    // qrcode settings below
    //-------------------------------------------
    
	$("#controlItemQrCode").click(function () {
        if ($("#qrcodeArea").is(':visible')) {
            $("#qrcodeArea").hide();
        } else {
            $("#qrcodeArea").show();
        }
    });        
    var qrcode;
    
    if (window.innerHeight - 45 < window.innerWidth) {
        qrcode = new QRCode("qrcodeArea", {width:window.innerHeight - 45, height:window.innerHeight - 45});
    } else {
        qrcode = new QRCode("qrcodeArea", {width:window.innerWidth - 20, height:window.innerWidth - 20});
    }
    qrcode.makeCode(window.location.protocol + '//' + window.location.host + '/clientScreenm?keyPhase=' + pageData.session.sessionKey);
    
    //-------------------------------------------
    // recording settings below
    //-------------------------------------------
    
    $("#controlItemRecording").click(function () {
        $("#dialog-recording").dialog("open").dialogExtend(dialogExtendOptions);
    });    
    
	$("#dialog-recording").dialog({
		autoOpen:false,
		width: 0.3 * window.innerWidth,
		modal:false,
		position: { at: 'left bottom'},
		closeOnEscape: false,
		open: function(event,ui) {},
		close: function(event, ui) {},
		buttons: {}	
	});
    
    $("#startRecord")
        .button()
        .click(function () {
            _pre = "";
            $(".ui-icon-bullet").css('background-image', 'url("/styles/images/ui-icons_cd0a0a_256x240.png")');
            
            JsMain.setKeyPhase(pageData.session.sessionKey);

            JsMain.start(_page, _pre);
            _isRecording = true;

            $("#recorderObject").css({
                position: "absolute",
                top: 25,
                left: 0
            });
            
            showRecordingTimer();        
        });
        
    $("#stopRecord")
        .button()
        .click(function () {
            clearInterval(recordingLoop);
            $(".ui-icon-bullet").css('background-image', 'url("/styles/images/ui-icons_454545_256x240.png")');
            
            JsMain.stop();
            _isRecording = false;             
        });

    $("#startRecord-P")
        .button()
        .click(function () {
            _pre = "P-";
            $(".ui-icon-bullet").css('background-image', 'url("/styles/images/ui-icons_cd0a0a_256x240.png")');
            
            JsMain.setKeyPhase(pageData.session.sessionKey);

            JsMain.start(_page, _pre);
            _isRecording = true;

            $("#recorderObject").css({
                position: "absolute",
                top: 25,
                left: 0
            });
            
            showRecordingTimer();        
        });

    $("#stopRecord-P")
        .button()
        .click(function () {
            clearInterval(recordingLoop);
            $(".ui-icon-bullet").css('background-image', 'url("/styles/images/ui-icons_454545_256x240.png")');
            
            JsMain.stop();
            _isRecording = false;             
        });        
    
	var control = true,
        _pre = "",       
        _page = 0,
        _isRecording = false;
    var recordingLoop;

    var showRecordingTimer = function () {
        if (JsMain.getRecordingTime() == 0) {
            setTimeout(showRecordingTimer,1000);
        } else {
            $("#recorderObject").css({
                top: -300,
                left: 0
            });
            recordingLoop = setInterval(function () {
                console.log(JsMain.getRecordingTime());
                var hours = Math.floor(JsMain.getRecordingTime() / 3600000),
                    mins = Math.floor(JsMain.getRecordingTime() / 60000),
                    secs = Math.floor(JsMain.getRecordingTime() / 1000);
                $("#controlItemRecording .ui-button-text").text(hours + ":" + mins + ":" + secs);
            }, 100);
        }
    }
    
	function getEditorAudio(){
		$("#preRecordingSelect").empty();
		var n = 1;
		for (var i=0; i<audioNames.length; i++) {
			if (audioNames[i].substring(audioNames[i].lastIndexOf("-")+1, audioNames[i].lastIndexOf(".")) == (pageData.session.currentPage - 1)) {
				$("#preRecordingSelect").append("<option value=\"" + audioNames[i] + "\">Page " + pageData.session.currentPage + " Audio" + n + "</option>");
				n++;
			}
		}
		$("#preRecordingSelect").trigger("change");
	}
	
    $("#convert")
        .button()
        .click(function(){
            $("#convert").button("disable");
            $.ajax({
                type: "POST",
                url: "session/editorAudioConvert",
                dataType: "json",
                cache: false,
                data: {"sessionId": pageData.session.sessionId, "sessionKey": pageData.session.sessionKey,},
                success: function(response) {
                    audioNames = response;
                    getEditorAudio();
                    audioUrl = "http://www.tkiee.com:8080/upload/" + pageData.session.sessionKey + "/recording/editor/" + $("#preRecordingSelect option:selected").val();
                    $("#jquery_jplayer_1").jPlayer("setMedia", {
                        m4a: audioUrl
                    });				
                    $("#dialog-audio").dialog("open");
                }
            });	
        });		
	
	var audioUrl;
	var audioNames = Array();
	
	$("#dialog-audio").dialog({
		autoOpen:false,
		height:200,
		width:300,
		modal:false,
		closeOnEscape: false,
		open: function(event, ui) {
			audioUrl = "http://www.tkiee.com:8080/upload/" + pageData.session.sessionKey + "/recording/editor/" + $("#preRecordingSelect option:selected").val();
			$("#jquery_jplayer_1").jPlayer("setMedia", {
				m4a: audioUrl
			});			
		},
		close: function(event, ui) {
			$("#preRecordingSelect").empty();
			$("#convert").button("enable");
		}	
	});
	
	$("#preRecordingSelect")				
			.change(function(){
				audioUrl = "http://www.tkiee.com:8080/upload/" + pageData.session.sessionKey + "/recording/editor/" + $("#preRecordingSelect option:selected").val();
				$("#jquery_jplayer_1").jPlayer("setMedia", {
					m4a: audioUrl
				});
				$(".jp-stop").trigger("click");
			});
	
	$("#jquery_jplayer_1").jPlayer({
		ready: function (event) {
			$(this).jPlayer("setMedia", {
				m4a: audioUrl
			});
		},
		swfPath: "../js",
		supplied: "m4a",
		wmode: "window",
		smoothPlayBar: true,
		keyEnabled: true,
		remainingDuration: true,
		toggleDuration: true
	});    
    
    //-------------------------------------------
    // filelists settings below
    //-------------------------------------------
    
    $("#dialog-filelist").append("<button id=\"openFileModify\">File Modify</button>");
    
	$("#dialog-fileModify").dialog({
		autoOpen:false,
		height:600,
		width:600,
		modal:true,
		closeOnEscape: false,
		close: function(event, ui) {
                $.ajax({
                    type: "POST",
                    url: "session/changestatus",
                    dataType: "json",
                    cache: false,
                    data: {"status": 2},
                    success: function(response) {
                        $("#fileModify").empty();
                        $("#uploader").hide();
                        location.reload();
                    }
                });			        
			},
		buttons: {
			"Ok": function() {
				$("#dialog-fileModify").dialog("close");
			}
		}			
	});
	
	$("#openFileModify")
		.button()
		.click(function(){
			$("#dialog-fileModify").dialog("open");
			$.ajax({
				type: "GET",
				url: "session/getuploadedfiles",
				dataType: "json",
				cache: false,
				data: {"sessionId": pageData.session.sessionId},
				success: function(response) {
					pageData.file = response;
					var filepage = 0,
						slides = [],
						order = {},
						replaceNumber = 0;
						
					for (var i = 0; i < response.length; i++) {
						if (response[i].type == "pdf") {
							var div = $("<div id=\"filemodify" + i + "\"></div>"),
								uploaderdiv = $("<div id=\"uploader" + i + "\" style=\"display:none;\"></div>"),
								fileuploaderdiv = $("<div id=\"fileuploader" + i + "\">Upload</div>"),
								li = $("<li>"),
								name = Array(),
								fileName;
							var buttonD = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"fileModifyDelete" + i + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
							var buttonR = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"fileModifyReplace" + i + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-wrench\"></span><span class=\"ui-button-text\">Delete</span>");
							
							div.appendTo("#fileModify");
							li.appendTo(div);
							uploaderdiv.appendTo(div);
							fileuploaderdiv.appendTo(uploaderdiv);
							
							for (var n = filepage; n < filepage + response[i].size; n++) {
								slides[n] = {"name":response[i].name, "page":n - filepage, "fileId": response[i].id, "startPage": filepage};
							}
							
							order[response[i].name] = response[i].order;
							
							name = response[i].name.split(".");
							fileName = name.pop();			
							switch (fileName) {
								case "ppt":
								case "pptx":
									$("<img src=\"/styles/images/icons-png/powerpointIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
									break;
								case "doc":
								case "docx":
									$("<img src=\"/styles/images/icons-png/wordIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
									break;					
								case "xls":
								case "xlsx":
									$("<img src=\"/styles/images/icons-png/excelIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
									break;				
								case "pdf":
									$("<img src=\"/styles/images/icons-png/pdfIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
									break;					
								default:
									break;
							}
							$("<a href=\"" + "#" + "\">").text(response[i].name + ": Page " + (filepage+1) + " - " + (filepage+response[i].size)).appendTo(li);
							buttonR.appendTo(li);
							buttonD.appendTo(li);
							buttonR.click({"i": i},function(Obj){
								if (confirm("Replace File?")) {
									replaceNumber = Obj.data.i;
									$("#uploader" + replaceNumber).show();
									$.ajax({
										type: 'POST',
										url: 'filemodify/delete',
										dataType: 'json',
										cache: false,
										data: {"sessionId": pageData.session.sessionId, "order": order[response[replaceNumber].name], "fileId": response[replaceNumber].id},
										success: function(response){
										
										}
									}); 									
								}													
							});
							buttonD.click({"order": order[response[i].name], "fileId": response[i].id, "i": i},function(Obj){
								console.log("fileId: " + Obj.data.fileId );
								if (confirm("Delete File?")) {
									$.ajax({
										type: 'POST',
										url: 'filemodify/delete',
										dataType: 'json',
										cache: false,
										data: {"sessionId": pageData.session.sessionId, "order": Obj.data.order, "fileId": Obj.data.fileId},
										success: function(response){
											$("#fileModifyDelete" + Obj.data.i).parent().remove();
										}
									}); 
								}							
							});
							fileuploaderdiv.uploadFile({
								url:"session/upload",
								multiple:false,
								fileName:"sessionFile",
                                maxFileSize: 1024*1024*10,
								formData: {"sessionId":pageData.session.sessionId, "order": order[response[replaceNumber].name]},
								onSuccess: function(files,data,xhr){
									
								},
								onError: function(files,status,errMsg){
									if (errMsg == "Forbidden") {
										alert("Please upload quiz file after session file completed!\nQuiz file must have same name with Session File! ");
									}
								},
								afterUploadAll:function() {
									$.ajax({
										type: "POST",
										url: "filemodify/add",
										dataType: "json",
										cache: false,
										data: {"sessionId": pageData.session.sessionId},
										success: function(response) {
											$("#uploader" + replaceNumber).hide();
											$("#fileModifyDelete" + replaceNumber).parent().text("new file!");
                                            $.ajax({
                                                type: "POST",
                                                url: "filemodify/updateStatus",
                                                dataType: "json",
                                                cache: false,
                                                data: {"sessionId": pageData.session.sessionId},
                                                success: function(response) {
                                                              
                                                }
                                            });		                                            
										}
									});										
								}
							}); 
							filepage += response[i].size;
						} else {
							var li = $("<li>");
							var buttonD = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"fileModifyDeleteUrl" + response[i].id + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
							li.appendTo($("#resourceUrlArea"));
							if (response[i].location.substring(0, 4) == "http") {
								$("<a href=\"" + response[i].location + "\"  target=\"_blank\">").text(response[i].name).appendTo(li);
							} else {
								$("<a href=\"http://" + response[i].location + "\"  target=\"_blank\">").text(response[i].name).appendTo(li);
							}
							buttonD.appendTo(li);
							buttonD.click({"fileId": response[i].id, "name": response[i].name, "location": response[i].location},function(Obj){
								console.log("fileId: " + Obj.data.fileId );
								if (confirm("Delete Url?")) {
									$.ajax({
										type: 'POST',
										url: 'filemodify/deleteUrl',
										dataType: 'json',
										cache: false,
										data: {"fileId": Obj.data.fileId, "name": Obj.data.name, "location": Obj.data.location},
										success: function(response){
											$("#fileModifyDeleteUrl" + Obj.data.fileId).parent().remove();
										}
									}); 
								}							
							});
						}
					} 
					pageData.session.slides = slides;
				}
			});	
		});
		
	$("#fileModifyAdd")
		.button()
		.click(function(){
			$("#uploader").show();
		});
		
	$("#resourceUrlAdd")
		.button()
		.click(function(){
			if ($("#resourceUrlInput").val()) {
				$.ajax({
					type: "POST",
					url: "filemodify/addUrl",
					dataType: "json",
					cache: false,
					data: {"sessionId": pageData.session.sessionId, "userId": pageData.session.userId, 'name': $("#resourceNameInput").val(), 'location': $("#resourceUrlInput").val()},
					success: function(response) {
						var li = $("<li>");
						var buttonD = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"fileModifyDeleteUrl" + response.id + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
						li.appendTo($("#resourceUrlArea"));
						if (response.location.substring(0, 4) == "http") {
							$("<a href=\"" + response.location + "\"  target=\"_blank\">").text(response.name).appendTo(li);
						} else {
							$("<a href=\"http://" + response.location + "\"  target=\"_blank\">").text(response.name).appendTo(li);
						}
						buttonD.appendTo(li);
						buttonD.click({"fileId": response.id, "name": response.name, "location": response.location},function(Obj){
							console.log("fileId: " + Obj.data.fileId );
							if (confirm("Delete Url?")) {
								$.ajax({
									type: 'POST',
									url: 'filemodify/deleteUrl',
									dataType: 'json',
									cache: false,
									data: {"fileId": Obj.data.fileId, "name": Obj.data.name, "location": Obj.data.location},
									success: function(response){
										$("#fileModifyDeleteUrl" + Obj.data.fileId).parent().remove();
									}
								}); 
							}							
						});
					}
				});	
			} 
		});		

	$("#fileuploader").uploadFile({
		url:"session/upload",
		multiple:true,
		fileName:"sessionFile",
        maxFileSize: 1024*1024*10,
		formData: {"sessionId": pageData.session.sessionId},
		onSuccess: function(files,data,xhr){
		
		},
		onError: function(files,status,errMsg){
			if (errMsg == "Forbidden") {
				alert("Please upload quiz file after session file completed!\nQuiz file must have same name with Session File! ");
			}
		},
		afterUploadAll:function() {
			$.ajax({
				type: "POST",
				url: "filemodify/add",
				dataType: "json",
				cache: false,
				data: {"sessionId": pageData.session.sessionId},
				success: function(response) {
                    $.ajax({
                        type: "POST",
                        url: "filemodify/updateStatus",
                        dataType: "json",
                        cache: false,
                        data: {"sessionId": pageData.session.sessionId},
                        success: function(response) {
                                      
                        }
                    });														
				}
			});			
		}
	});
    
    //-------------------------------------------
    // speaker note settings below
    //-------------------------------------------

	$("#dialog-speakernote").dialog({
		autoOpen:false,
		width: 0.3 * window.innerWidth,
        height: 0.5* window.innerHeight,
		modal:false,
		closeOnEscape: false,
        position: { my: 'left top', at: 'left top+25' },
		open: function(event,ui) {
            $("#speakerNoteArea").css({
                width: "95%",
                height: "95%"
            });
        },
		close: function(event, ui) {},
		buttons: {
			"Save": function() {
                $.ajax({
                    type: "POST",
                    url: "note/slidenoteadd",
                    dataType: "json",
                    cache: false,
                    data: {"sessionId": pageData.session.sessionId, "fileId": pageData.session.currentFileId, "page": pageData.session.currentFilePage, "content": $("#speakerNoteArea").val()},
                    success: function(response) {
                        if (response.msg) {
                            
                        } else{		
                            speakerNote();
                        }
                    }
                });		
			}
		}	
	});
    
    $("#controlItemspeakerNote").click(function () {
        $("#dialog-speakernote").dialog("open").dialogExtend(dialogExtendOptions);
    });    
    
    var slideNoteRes;
    
	var speakerNote = function () {
		$("#speakerNoteArea").val("");
		$.ajax({
			type: "GET",
			url: "note/slidenotes",
			dataType: "json",
			cache: false,
			data:{"fileId": pageData.session.currentFileId, "page": pageData.session.currentFilePage},
			success: function(response) {
				slideNoteRes = response.content.replace(/\^\^/g, "<br>");
				$("#speakerNoteArea").val(slideNoteRes);
				$("#speakerNoteArea").height($("#speakerNoteArea")[0].scrollHeight);                
			}
		});
	}
    
    //-------------------------------------------
    // pointer settings below
    //-------------------------------------------
    
	var rateX = 0, rateY = 0;
	var follower = $("#follower");
	var followerLoop;    
//    var annotationInterval;
    
	$("#follower").css({
		zIndex : 9999
	});
	socket.on('visualPointerStart', function(res){
        rateX = res.data.rateX;
		rateY = res.data.rateY;
		$("#follower").show();
        followerLoop = setInterval(function(){
                follower.css({left:rateX * window.innerWidth, top: rateY * window.innerHeight, zIndex: 9999});
        }, 30);        
	});
	
	socket.on('visualPointerStop', function(res){
		$("#follower").hide();
        clearInterval(followerLoop);
	});  
    
    //-------------------------------------------
    // annotation settings below
    //-------------------------------------------

    $("#controlItemAnnotation").click(function () {
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
    
    $("#colors_sketch").bind('mouseup', function () {
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
    // next slide settings below
    //-------------------------------------------    
    
	$("#dialog-nextslide").dialog({
		autoOpen:false,
		width: "auto",
        height: "auto",
		modal:false,
		closeOnEscape: false,
        position: { my: 'right bottom', at: 'right bottom+25' },
		open: function(event,ui) {},
		close: function(event, ui) {},
		buttons: {}	
	});
    
    $("#controlItemNextSlide").click(function () {
        $("#dialog-nextslide").dialog("open").dialogExtend(dialogExtendOptions);
    });    

    //-------------------------------------------
    // dashboard settings below
    //-------------------------------------------
    
    var dashboardInfo;
    
	$("#controlItemOpenDashboard").click(function () {
        window.open('http://localhost:1337/dashboard', 'Display','left=20,top=20,width=1024,height=768,status=0, addressbar=0,menubar=0,location=1,toolbar=0,resizable=0');
    });    

/*	$("#dialog-dashboard").dialog({
		autoOpen:false,
		height:0.5 * window.innerHeight,
		width: window.innerWidth,
		modal:false,
		position: {at: "left bottom"},
		closeOnEscape: false,
		open: function (event,ui) {

		},
		close: function (event, ui) {},
		buttons: {
			"Ok": function() {
				$("#dialog-dashboard").dialog("close");
			}
		}	
	});  */

/*	function getDashboardInfo(){
		$.ajax({
			type: "GET",
			url: "dashboard/getInfo",
			dataType: "json",
			cache: false,
			data: {"sessoinId": pageData.session.sessionId, "page": (pageData.session.currentPage - 1)},
			success: function(response) {
				$("#dashboardTagDiv").empty();
				if (response.error) {
				
				} else {
					$("#dashboardTagDiv").append("<p>Tag number for this slide: <span style=\"color:red;\">" + response.num[pageData.session.currentPage - 1] +"</span></p>");
					$("#dashboardTagDiv").append("<p>Participants who tagged this slide: </p>");
					for (var i = 0; i < response.user.length; i++) {
						$("#dashboardTagDiv").append("<p><span>" + response.user[i].firstName + " " + response.user[i].lastName + " Email: " + response.user[i].email + "</span></p>");
					}					
				}
			}			
		});	
	}  */
    
    //-------------------------------------------
    // scanner settings below
    //-------------------------------------------    

    //-------------------------------------------
    // feedback settings below
    //-------------------------------------------
    
    $("#interactivityAreaFeedback").append("<label>Understandability: </label>");
    $("#interactivityAreaFeedback").append("<div><img class=\"thumbup\" id=\"thumbup1\" src=\"/styles/images/thumbup.png\" style=\"height:75px; width:75px\" /></div>");
    $("#interactivityAreaFeedback").append("<div><img class=\"thumbdown\" id=\"thumbdown1\" src=\"/styles/images/thumbdown.png\" style=\"height:75px; width:75px\" /></div>");
    $("#interactivityAreaFeedback").append("<label>Speed: </label>");
    $("#interactivityAreaFeedback").append("<div><img class=\"thumbup\" id=\"thumbup2\" src=\"/styles/images/thumbup.png\" style=\"height:75px; width:75px;\" /></div>");
    $("#interactivityAreaFeedback").append("<div><img class=\"thumbdown\" id=\"thumbdown2\" src=\"/styles/images/thumbdown.png\" style=\"height:75px; width:75px\" /></div>");
    
	socket.on('feedbackReceive', function(res) {
		if (res.percentage > 0.1) {
            notificationDesktop({"name": "Feedback"});
            console.log($("#interactivityNotificationFeedback").position().top - $("#interactivityNotificationQuestion").position().top);
			if (res.feedbackOptionId == "1") {
				$("#thumbup1").hide();
				$("#thumbdown1").show();
			} else {
				$("#thumbup2").hide();
				$("#thumbdown2").show();
			}		
		} else {
		
		}
	});
    
    //-------------------------------------------
    // question settings below
    //-------------------------------------------    
    
	socket.on('commentReceive', function(res) {
        var li = $("<li style=\"list-style-type: disc;\" class=\"comment comment" + res.page + "\">");
		$("<a>").text(res.content).appendTo(li);
		li.appendTo("#displayQuestion");
        
        notificationDesktop({"name": "Question"});          
	});

    $('body').on('click', '.comment', function(){
        $("#dialog-form1").append("<h4>" + $(this).text() + "</h4>");
        $("#dialog-form").dialog("open");
        socket.post('/socket/broadcast', {'event':'commentDialog', 'data':{"content":$(this).text(), "OrC": 0}}, function(response) {});	
    });     
    
	socket.on('commentDialog', function(res) {
        console.log('commentDialog');
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
    
	var quizCurrent = Array();
	var quizOptions = {};
    var quizTimeout;
    var quizStopInterval = {};
    
    $("#QuizToolbar").append("<button id=\"addQuiz\" style=\"display: inline;\">Add Quiz</button>");
    $("#QuizToolbar").append("<input id=\"quizStopTimer\" style=\"display: inline;\"></input>");
    $("#QuizToolbar").append("<label style=\"display: inline;\"> Mins</label>");
    $("#QuizToolbar").append("<button id=\"stopQuiz\" style=\"display: inline;\">Stop Quiz</button>");
    $( "#interactivityAreaQuiz" ).append("<div id=\"Quiz\"></div>");

    $( "#Quiz" ).height($("#interactivityAreaQuiz").height() - $("#QuizToolbar").height() - 30);
	$( "#Quiz" ).accordion({
        heightStyle:"content",
		collapsible: true,
		active: false
    });

    $("#addQuiz")
        .button({text: true, label: 'Add Quiz',icons:{primary:"ui-icon-circle-plus"}})
        .click(function(){
            openQuiz({'file': pageData.file, 'session': pageData.session, 'fileId': pageData.session.currentFileId, 'page': pageData.session.currentFilePage, 'quizId': ""});
        });
        
	$("#stopQuiz")
        .button({text: true, label: 'Stop Quiz',icons:{primary:"ui-icon-pause"}})
        .click(function(){
            if (confirm("End Quiz?")) {
                for (var i = 0; i < quizCurrent.length; i++) {
                    if (quizCurrent[i]){
                        $.ajax({
                            type: "POST",
                            url: "quiz/stop",
                            dataType: "json",
                            cache: false,
                            data: {"quizId": quizCurrent[i]},
                            success: function(response) {
                                clearInterval(quizStopInterval[response.id]);
                                $("#quizQuestionLabel" + response.id + "T").text('');
                            }
                        });					
                    }
                }
                quizCurrent = [];
                socket.post('/socket/broadcast', {'event':'stopQuizforHost'}, function(response) {console.log(response);});	
            } else {
            
            }
        });         

	function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 

    for (var i = 0; i < pageData.quiz.length; i ++) {
        var quizQuestion = JSON.parse(pageData.quiz[i].question);
        quizOptions[pageData.quiz[i].id] = pageData.quiz[i];
        if (pageData.quiz[i].options === 0) {
            quizShortAnswer({'class':"", 'id': pageData.quiz[i].id, 'i':i, 'page': pageData.quiz[i].page , 'question': quizQuestion.question, 'options': 0, 'keyword': pageData.quiz[i].keyword, 'fileId': pageData.quiz[i].fileId});
            quizButtonSet({'class':"", 'id': pageData.quiz[i].id, 'i':i, 'page': pageData.quiz[i].page , 'question': quizQuestion.question, 'options': 0, 'keyword': pageData.quiz[i].keyword, 'fileId': pageData.quiz[i].fileId});
        } else {
            quizMultipleChoice({'class':"", 'id': pageData.quiz[i].id, 'i':i, 'page': pageData.quiz[i].page , 'question': quizQuestion.question, 'options':quizQuestion.options, 'keyword': pageData.quiz[i].keyword, 'fileId': pageData.quiz[i].fileId});
            quizButtonSet({'class':"", 'id': pageData.quiz[i].id, 'i':i, 'page': pageData.quiz[i].page , 'question': quizQuestion.question, 'options':quizQuestion.options, 'keyword': pageData.quiz[i].keyword, 'fileId': pageData.quiz[i].fileId});
        }
        $("#Quiz").accordion("refresh");
        if (pageData.quiz[i].page === 0 && (pageData.quiz[i].fileId === 0 || pageData.quiz[i].fileId === pageData.session.currentFileId)) {
            $("#quiz" + pageData.quiz[i].id).show();			
        }  else {
            $("#quiz" + pageData.quiz[i].id).hide();
        }
    }
    
	function quizShortAnswer(obj){
		if (obj.page === 0) {
			$("#Quiz" + obj.class).append("<h3 id=\"quiz" + obj.class + obj.id + "\"><span style=\"display:block\">Default Question <b>KeyWord:</b> " + obj.keyword + "</span></h3>");
		} else {
			$("#Quiz" + obj.class).append("<h3 id=\"quiz" + obj.class + obj.id + "\"><span style=\"display:block\"><b>KeyWord:</b> " + obj.keyword + "</span></h3>");
		}
		$("#Quiz" + obj.class).append("<div id=\"quizQuestion" + obj.class + obj.id + "\"><p>" + obj.question + "</p></div>");
        $("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "\"></button>");
		$("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "P\"></button>");
		$("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "E\"></button>");
		$("#quizQuestionButton" + obj.class + obj.id + "E").attr("fileId", obj.fileId);
		$("#quizQuestionButton" + obj.class + obj.id + "E").attr("page", obj.page);
		$("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "D\"></button>");
		$("#quiz" + obj.class + obj.id).append("<label id=\"quizQuestionLabel" + obj.class + obj.id + "T\" style=\"color:red;\"></label>");
		$("#quizQuestion" + obj.class + obj.id).append("<label>Answers: </label>");
		$("#quizQuestion" + obj.class + obj.id).append("<div class=\"tagCloud\" id=\"tagCloud" + obj.class + obj.id +"\"></div>");
		$("#tagCloud" + obj.class + obj.id).append("<ul class=\"tagList\" id=\"tagList" + obj.class + obj.id +"\"></ul>");		
	}
	
	function quizMultipleChoice(obj){
		if (obj.page === 0) {
			$("#Quiz" + obj.class).append("<h3 id=\"quiz" + obj.class + obj.id + "\"><span style=\"display:block\">Default Question <b>KeyWord:</b> " + obj.keyword + "</span></h3>");
		} else {
			$("#Quiz" + obj.class).append("<h3 id=\"quiz" + obj.class + obj.id + "\"><span style=\"display:block\"><b>KeyWord:</b> " + obj.keyword + "</span></h3>");
		}
		$("#Quiz" + obj.class).append("<div id=\"quizQuestion" + obj.class + obj.id + "\"><p>" + obj.question + "</p></div>");
		quizOptions[obj.id]["optionNames"] = [];
		for (var n = 0; n < obj.options.length; n++) {
			$("#quizQuestion" + obj.class + obj.id).append("<input type=\"checkbox\" id=\"quiz" + obj.class + obj.id + "Checkbox" + n + "\">" + "<label for=\"quiz" + obj.class + obj.id + "Checkbox" + n + "\">" + obj.options[n] + "</label>");
			quizOptions[obj.id]["optionNames"][n] = obj.options[n];
			quizOptions[obj.id][obj.options[n]] = 0;
		}
        $("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "\"></button>");
		$("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "P\"></button>");
		$("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "E\"></button>");
		$("#quizQuestionButton" + obj.class + obj.id + "E").attr("fileId", obj.fileId);
		$("#quizQuestionButton" + obj.class + obj.id + "E").attr("page", obj.page);
		$("#quiz" + obj.class + obj.id).append("<button id=\"quizQuestionButton" + obj.class + obj.id + "D\"></button>");
		$("#quiz" + obj.class + obj.id).append("<label id=\"quizQuestionLabel" + obj.class + obj.id + "T\" style=\"color:red;\"></label>");
		$("#quizQuestion" + obj.class + obj.id).append("<label>Answers: </label>");
		for (var ii = 0; ii < quizOptions[obj.id].options; ii++) {
			$("#quizQuestion" + obj.class + obj.id).append("<label id=\"quiz" + obj.id + "Label" + (ii+1) + "\">Option" + (ii + 1) + ": " + quizOptions[obj.id][obj.options[ii]] + "</label>");
		}
	}

	function quizButtonSet(obj){
		$("#quizQuestionButton" + obj.class + obj.id)
            .button({text: false, label: 'Quiz Start',icons:{primary:"ui-icon-play"}})
            .click({'id':obj.id,'num': obj.i, 'class': ""}, function(res){
                 quizCurrent[res.data.id] = res.data.id;
                 var quizStopTimer = $("#quizStopTimer").val();
                 var quizStopTimerCount = quizStopTimer * 60;
                 
                 if (quizStopInterval[obj.id]) {
                    clearInterval(quizStopInterval[obj.id]);
                 }
                 
                 if (isNumber(quizStopTimer)) {
                    
                 } else {
                    quizStopTimer = 0;
                 }
                 console.log("quizStopTimer: " + quizStopTimer);
                 $.ajax({
                    type: "POST",
                    url: "quiz/start",
                    dataType: "json",
                    cache: false,
                    data: {"quizId": res.data.id, "timer": quizStopTimer},
                    success: function(response) {
                        $("#dialog-alert").dialog("open");
                        $("#alerts").append("<label style=\"font-size:150%;color:#000099;\">Quiz Start!</label>");								
                        socket.post('/socket/broadcast', {'event':'startQuizforHost', 'data':{'id':res.data.id}}, function(response) {console.log(response);});
                        quizStopInterval[obj.id] = setInterval(function () {
                            if (quizStopTimerCount != 0) {
                                quizStopTimerCount--;
                                $("#quizQuestionLabel" + obj.class + obj.id + "T").text(quizStopTimerCount + " Secs");
                            } else {
                                $("#quizQuestionLabel" + obj.class + obj.id + "T").text('');
                                clearInterval(quizStopInterval[obj.id]);
                            }
                        }, 1000);
                    }
                });
            });
        $("#quizQuestionButton" + obj.class + obj.id + "P")
            .button({text: false, label: 'Share as Popup',icons:{primary:"ui-icon-circle-zoomin"}})
            .click({'id':obj.id,'num': obj.i, 'class': ""}, function(res){
                $("#dialog-form").dialog("open");
                var quizContent = $("#quizQuestion" + res.data.class + res.data.id).html();
                $('#dialog-form1').append(quizContent);
            });
		$("#quizQuestionButton" + obj.class + obj.id + "E")
            .button({text: false, label: 'Edit',icons:{primary:"ui-icon-wrench"}})
            .click({'id':obj.id,'num': obj.i, 'class': ""}, function(res){
                openQuiz({'file': pageData.file, 'session': pageData.session, 'fileId': $("#quizQuestionButton" + obj.class + obj.id + "E").attr("fileId"), 'page':$("#quizQuestionButton" + obj.class + obj.id + "E").attr("page"), 'quizId': obj.id});	
                $("#inputQuizKeyword").val(obj.keyword);
                $("#inputQuizQuestion").val(obj.question);
                if (obj.options == 0) {
                    $('#radioQuizOptions label').eq(0).trigger("click");
                } else {
                    $('#radioQuizOptions label').eq(1).trigger("click");
                    for(var i=0; i < obj.options.length; i++) {
                        quizEditorOptionI[_iQuiz] = 1;
                        var button = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"quizEditorOptionButton" + _iQuiz + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
                        $("#quizEditorOption").append("<div id=\"quizEditorOption" + _iQuiz + "\"></div>");
                        $("#quizEditorOption" + _iQuiz).append("<label for=\"\">Option:</label><input id=\"quizEditorOptionInput" + _iQuiz + "\" style=\"display:inline;width:90%;\" value=\"" + obj.options[i] + "\"></input>");
                        button.appendTo("#quizEditorOption" + _iQuiz);
                        button.click(function(){
                            var id = $(this).attr('id');
                            quizEditorOptionI[id.substr(22, 23)] = 0;
                            $(this).parent().remove();
                        });
                        _iQuiz++;
                    }	
                }
            });
		$("#quizQuestionButton" + obj.class + obj.id + "D")
            .button({text: false, label: 'Delete',icons:{primary:"ui-icon-trash"}})
            .click({'id':obj.id,'num': obj.i, 'class': ""}, function(res){
                var options;
                if ($(this).text() == "Delete") {
                    options = {label: "Undo", icons: {primary: "ui-icon-arrowreturnthick-1-w"}};
                    timeout = setTimeout(function() {	
                        $("#Quiz").accordion({active:false});
                        $("#quizQuestion" + res.data.class + res.data.id).remove();
                        $("#quiz" + res.data.class + res.data.id).remove();
                        $.ajax({
                            type: "POST",
                            url: "quiz/delete",
                            dataType: "json",
                            cache: false,
                            data: {"quizId": res.data.id},
                            success: function(res) {

                            }
                        });
                        options = {label: "Delete", icons: {primary: "ui-icon-trash"}};
                        socket.post('/socket/broadcast', {'event':'quizDelete', 'data':{"quizId": res.data.id}}, function(response) {console.log(response);});
                    },10000);						
                } else {
                    options = {label: "Delete", icons: {primary: "ui-icon-trash"}};
                    clearTimeout(timeout);
                }
                $( this ).button( "option", options );
            });		
	}
	
	function openQuiz(obj){
		$("#quizEditor").dialog("open");
        $("#inputQuizFile").append("<option value=\"0\">Default</option>");
        for (var i = 0; i < obj.file.length; i++) {
            $("#inputQuizFile").append("<option value=\"" + obj.file[i].id + "\">" + obj.file[i].name + "</option>");
        }
        for (var i = 0; i < obj.file.length; i++) {
            if (obj.file[i].name == obj.session.currentFileName){
                $("#inputQuizPage").append("<option value=\"0\">Default</option>");
                for (var j = 0; j < obj.file[i].size; j++) {
                    $("#inputQuizPage").append("<option value=\"" + (j + 1) + "\">Page " + (j + 1) + "</option>");
                }			
            } else{
            
            }
        }		
        if (!obj.fileId) {
            $("#inputQuizFile").val(0);
        } else {
            $("#inputQuizFile").val(obj.fileId);
        }
        if (!obj.page) {
            $("#inputQuizPage").val(0);
        } else {
            $("#inputQuizPage").val(obj.page);
        }
		$("#quizIdLabel").text(obj.quizId);
		getAutoQuizInfo();
	}
	
	socket.on('startQuizforHost', function(res){
		quizCurrent[res.data.id] = res.data.id;
	});    
    
    function showHideQuiz() {
        for (var i = 0; i < pageData.quiz.length; i++) {			
            $("#Quiz").accordion({active:false});
            if (pageData.quiz[i].page == pageData.session.currentFilePage && pageData.quiz[i].fileId == pageData.session.currentFileId) {
                $("#quiz" + pageData.quiz[i].id).show();
            } else if (pageData.quiz[i].fileId == 0){
                $("#quiz" + pageData.quiz[i].id).show();
            } else if (pageData.quiz[i].fileId == pageData.session.currentFileId && pageData.quiz[i].page == 0) {
                $("#quiz" + pageData.quiz[i].id).show();
            } else {
                $("#quiz" + pageData.quiz[i].id).hide();
            }
        }
    }
    
	socket.on('quizSubmit', function(res) {
		console.log('Quiz answer submited' + res.quizId);
		if ( quizOptions[res.quizId].options === 0 ) {
			$.getJSON("quiz/gettags", {"quizId":res.quizId},function(data) {
				$("#tagList" + res.quizId).empty();
				$.each(data.tags, function(i, val) {
					var li = $("<li>");
					$("<a>").text(val.tag).appendTo(li);								 
					li.appendTo("#tagList"+res.quizId);
				});
			});
			$("#quizQuestion" + res.quizId).append("<p>" + res.answer + "</p>");	
		} else {
			quizOptions[res.quizId][res.answer] += 1;
			for (var i = 0; i < quizOptions[res.quizId].options; i++) {
				if (quizOptions[res.quizId]["optionNames"][i] == res.answer) {
					$("#quiz" +res.quizId + "Label" + (i+1)).text("Option" + (i + 1) + ": " + quizOptions[res.quizId][res.answer]);
				}
			} 
		}
		$("#Quiz").accordion("refresh");
	});

	var quizEditorOptionI = Array(),
		_iQuiz = 0;
        
	$("#radioQuizOptions")
        .buttonset()
        .change(function(){
            quizEditorOptionI = [];
            if ($("#radioQuizOptions2").is(':checked')) {
                $("#inputQuizOptions").show();
            } else {
                $("#inputQuizOptions").hide();
                $("#quizEditorOption").empty();
            }
        });
        
	$("#inputQuizOptions").hide();		
	$("#inputQuizOptions")
        .button({text: false, label: 'Add Options',icons:{primary:"ui-icon-plus"}})
        .click(function(){
            quizEditorOptionI[_iQuiz] = 1;
            var button = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"quizEditorOptionButton" + _iQuiz + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
            $("#quizEditorOption").append("<div id=\"quizEditorOption" + _iQuiz + "\"></div>");
            $("#quizEditorOption" + _iQuiz).append("<label for=\"\">Option:</label><input id=\"quizEditorOptionInput" + _iQuiz + "\" style=\"display:inline;width:90%;\"></input>");
            button.appendTo("#quizEditorOption" + _iQuiz);
            button.click(function(){
                var id = $(this).attr('id');
                quizEditorOptionI[id.substr(22, 23)] = 0;
//	get string after "_"		id.split("_")[1];
                $(this).parent().remove();
            });
            _iQuiz++;
        });        
    
	$("#inputQuizFile")
        .change(function(){
            $("#inputQuizPage").empty();
            if ($("#inputQuizFile option:selected").text() == "Default" ) {
                $("#inputQuizPage").append("<option value=\"0\">Default</option>");
                $("#inputQuizPage").val(0);
            } else {
                for (var i = 0; i < pageData.file.length; i++) {
                    if (pageData.file[i].name == $("#inputQuizFile option:selected").text()){
                            $("#inputQuizPage").append("<option value=\"0\">Default</option>");
                        for (var j = 0; j < pageData.file[i].size; j++) {
                            $("#inputQuizPage").append("<option value=\"" + (j + 1) + "\">Page " + (j + 1) + "</option>");
                        }			
                    } else {
                    
                    }
                }					
            }
        });

	$("#quizEditor").dialog({
        autoOpen:false,
        height:500,
        width:500,
        modal:true,
        close:function(){
            $("#inputQuizFile").empty();
            $("#inputQuizPage").empty();
            $("#quizEditorOption").empty();
            $("#inputQuizKeyword").val("");
            $("#inputQuizQuestion").val("");
            quizEditorOptionI = [];
            _iQuiz=0;
        },
        buttons:{
            "Confirm": function() {
                var addQuizQuestion = {},
                    addQuizOption = 0,
                    options = [];
                addQuizQuestion.question = $("#inputQuizQuestion").val();
                if ($("#radioQuizOptions2").is(':checked')) {			
                    for (var i = 0; i < _iQuiz ; i++) {
                        if (quizEditorOptionI[i] == 1) {
                            options.push($("#quizEditorOptionInput" + i).val());
                        } else {
                        }
                    }
                    addQuizQuestion.options = options;
                    addQuizOption = options.length;
                } else {
                    addQuizOption = 0;
                }
                if ($("#quizIdLabel").text() == "") {
                    $.ajax({
                        type: "POST",
                        url: "quiz/add",
                        dataType: "json",
                        cache: false,
                        data: {"page": $("#inputQuizPage").val(), "question": JSON.stringify(addQuizQuestion), "options": addQuizOption, "keyword": $("#inputQuizKeyword").val(), "fileId" : $("#inputQuizFile").val()},
                        success: function(res) {
                            pageData.quiz.push(res);
                            var quizQuestion = JSON.parse(res.question);
                            quizOptions[res.id] = res;
                            if (res.options === 0) {
                                quizShortAnswer({'class':"", 'id': res.id, 'i':0, 'page': res.page , 'question': quizQuestion.question, 'options': 0, 'keyword': res.keyword, 'fileId': res.fileId});
                                quizButtonSet({'class':"", 'id': res.id, 'i':0, 'page': res.page , 'question': quizQuestion.question, 'options': 0, 'keyword': res.keyword, 'fileId': res.fileId});
                            } else {
                                quizMultipleChoice({'class':"", 'id': res.id, 'i':0, 'page': res.page , 'question': quizQuestion.question, 'options':quizQuestion.options, 'keyword': res.keyword, 'fileId': res.fileId});
                                quizButtonSet({'class':"", 'id': res.id, 'i':0, 'page': res.page , 'question': quizQuestion.question, 'options':quizQuestion.options, 'keyword': res.keyword, 'fileId': res.fileId});
                            }
                            $("#Quiz" + "").accordion("refresh");
                            if (res.page == pageData.session.currentFilePage && res.fileId == pageData.session.currentFileId) {
                                $("#quiz" + res.id).show();
                            } else if (res.fileId == 0) {
                                $("#quiz" + res.id).show();
                            } else if (res.fileId == pageData.session.currentFileId && res.page == 0) {
                                $("#quiz" + res.id).show();
                            } else {
                                $("#quiz" + res.id).hide();
                            }
                            socket.post('/socket/broadcast', {'event':'quizEdit', 'data':{"page": $("#inputQuizPage").val(), "question": JSON.stringify(addQuizQuestion), "options": addQuizOption, "keyword": $("#inputQuizKeyword").val(), "fileId": $("#inputQuizFile").val(), "quizId": res.id}}, function(response) {console.log(response);});
                        }
                    });								
                } else {
                    $.ajax({
                        type: "POST",
                        url: "quiz/update",
                        dataType: "json",
                        cache: false,
                        data: {"page": $("#inputQuizPage").val(), "question": JSON.stringify(addQuizQuestion), "options": addQuizOption, "keyword": $("#inputQuizKeyword").val(), "fileId" : $("#inputQuizFile").val(), "quizId": $("#quizIdLabel").text()},
                        success: function(res) {
                            $("#Quiz").accordion({active:false});
                            $("#quizQuestion" + res[0].id).remove();
                            $("#quiz" + res[0].id).remove();
                            pageData.quiz.push(res[0]);
                            var quizQuestion = JSON.parse(res[0].question);
                            quizOptions[res[0].id] = res[0];
                            if (res[0].options === 0) {
                                quizShortAnswer({'class':"", 'id': res[0].id, 'i':0, 'page': res[0].page , 'question': quizQuestion.question, 'options': 0, 'keyword': res[0].keyword, 'fileId': res[0].fileId});
                                quizButtonSet({'class':"", 'id': res[0].id, 'i':0, 'page': res[0].page , 'question': quizQuestion.question, 'options': 0, 'keyword': res[0].keyword, 'fileId': res[0].fileId});
                            } else {
                                quizMultipleChoice({'class':"", 'id': res[0].id, 'i':0, 'page': res[0].page , 'question': quizQuestion.question, 'options':quizQuestion.options, 'keyword': res[0].keyword, 'fileId': res[0].fileId});
                                quizButtonSet({'class':"", 'id': res[0].id, 'i':0, 'page': res[0].page , 'question': quizQuestion.question, 'options':quizQuestion.options, 'keyword': res[0].keyword, 'fileId': res[0].fileId});
                            }
                            $("#Quiz" + "").accordion("refresh");
                            if (res[0].page == pageData.session.currentFilePage && res[0].fileId == pageData.session.currentFileId) {
                                $("#quiz" + res[0].id).show();
                            } else if (res[0].fileId == 0) {
                                $("#quiz" + res[0].id).show();
                            } else if (res[0].fileId == pageData.session.currentFileId && res[0].page == 0) {
                                $("#quiz" + res[0].id).show();
                            } else {
                                $("#quiz" + res[0].id).hide();
                            }
                            socket.post('/socket/broadcast', {'event':'quizEdit', 'data':{"page": $("#inputQuizPage").val(), "question": JSON.stringify(addQuizQuestion), "options": addQuizOption, "keyword": $("#inputQuizKeyword").val(), "fileId": $("#inputQuizFile").val(), "quizId": res[0].id}}, function(response) {console.log(response);});
                        }
                    });								
                }
                $("#inputQuizFile").empty();
                $("#inputQuizPage").empty();
                $("#quizEditorOption").empty();
                quizEditorOptionI = [];
                _iQuiz=0;
                $("#quizEditor").dialog("close");
            },
            Cancel: function() {
                $("#inputQuizFile").empty();
                $("#inputQuizPage").empty();
                $("#quizEditorOption").empty();
                quizEditorOptionI = [];
                _iQuiz=0;
                $("#quizEditor").dialog("close");
            }
        }
	});
	
	var autoQuizTagArray = Array();
	var autoQuizTranslateArray = Array();
	
	function getAutoQuizInfo() {
		if (!pageData.session.currentFileId || !pageData.session.currentFilePage) {
			setTimeout(getAutoQuizInfo, 100);
		} else {
			$.ajax({
				type: "POST",
				url: "translation/getkeywords",
				dataType: "json",
				cache: false,
				data: {"fileId": pageData.session.currentFileId, "page": pageData.session.currentFilePage},
				success: function(response) {
					if (response.msg) {
					
					} else{
						for (var i=0; i<response.tags.length; i++) {
							if (/\s/.test(response.tags[i].tag)) {					
								autoQuizTranslation({"word": response.tags[i].tag, "language": "en_wiki"});
							}
						}
					}
				}
			});
		}
	}	

	function autoQuizTranslation (obj){
		$.ajax({
			type: "GET",
			url: "translation/getcustom",
			dataType: "json",
			data: {"word": obj.word},
			success: function (response) {
				if (response.error) {
					$.ajax({
						type: "GET",
						url: "translation/translate",
						dataType: "json",
						data: {"word": obj.word, "language": obj.language},
						success: function (res) {			
							if (res.error) {
							
							} else {
								autoQuizTagArray.push(obj.word);
								autoQuizTranslateArray.push(JSON.parse(res.translation).join(","));
							}
						}
					});					
				} else {
					autoQuizTagArray.push(obj.word);
					autoQuizTranslateArray.push(response.translation);
				}
			}
		});							
	}
	
	$("#autoQuizQuestion")
		.button()
		.click(function(){
		$("#quizEditorOption").empty();
		_iQuiz = 0;
		uniqueRandoms = [];
		if ($("#radioQuizOptions1").is(':checked')) {
			$("#inputQuizQuestion").val('what is ' + autoQuizTagArray[Math.floor(Math.random() * autoQuizTagArray.length)] + ' about?');
		} else {
			$("#inputQuizQuestion").val("Which of the followings is most relevant to " + autoQuizTranslateArray[Math.floor(Math.random() * autoQuizTranslateArray.length)] + " ?");
			if ($("#radioQuizOptions1").is(':checked')) {
				$("#inputQuizQuestion").val('what is ' + autoQuizTagArray[Math.floor(Math.random() * autoQuizTagArray.length)] + ' about?');
			} else {
				$("#inputQuizQuestion").val("Which of the followings is most relevant to " + autoQuizTranslateArray[Math.floor(Math.random() * autoQuizTranslateArray.length)] + " ?");
				if (autoQuizTagArray.length > 2) {
					for (var i=0; i<3; i++) {
						var nn = makeUniqueRandom({"num": autoQuizTagArray.length});	
						$("#inputQuizOptions").trigger("click");
						$("#quizEditorOptionInput" + i).val(autoQuizTagArray[nn]);
					}
					$("#inputQuizOptions").trigger("click");
					$("#quizEditorOptionInput3").val("None of above.");
				} else if (autoQuizTagArray.length == 2) {
					for (var i=0; i<autoQuizTagArray.length; i++) {
						var nn = makeUniqueRandom({"num": autoQuizTagArray.length});										
						$("#inputQuizOptions").trigger("click");
						$("#quizEditorOptionInput" + i).val(autoQuizTagArray[nn]);
					}
					$("#inputQuizOptions").trigger("click");
					$("#quizEditorOptionInput" + autoQuizTagArray.length).val("None of above.");
				} else {
					$("#inputQuizOptions").trigger("click");
					$("#quizEditorOptionInput0").val(autoQuizTagArray[0]);
				}
			}		
		} 
	});		
	
	var uniqueRandoms = [];
	function makeUniqueRandom(Obj) {
		// refill the array if needed
		if (!uniqueRandoms.length) {
			for (var i = 0; i < Obj.num; i++) {
				uniqueRandoms.push(i);
			}
		}
		var index = Math.floor(Math.random() * uniqueRandoms.length);
		var val = uniqueRandoms[index];

		// now remove that value from the array
		uniqueRandoms.splice(index, 1);

		return val;
	}
    
	socket.on('quizDialog', function(res) {
		console.log("Open Quiz Content: " + res + "in Dialog");
		if (res.data.OrC == "Display") {
			$("#dialog-form").dialog("open");
			var quizContent = $("#quizQuestion" + res.data.class + res.data.id).html();
			$('#dialog-form1').append(quizContent);					
		} else {
			$("#dialog-form").dialog("close");
		}		
	});
    
	socket.on('quizExpand', function(res) {
		$("#quiz" + res.data.class + res.data.id).click();
	});
    
    //-------------------------------------------
    // evaluation settings below
    //-------------------------------------------
    
    var evaluationOptions = {};
    
    $("#EvaluationToolbar").append("<button id=\"addEvaluation\" style=\"display: inline;\">Add Evaluation</button>");
    $("#EvaluationToolbar").append("<button id=\"evaluationStart\" style=\"display: inline;\">Start Evaluation</button>");
    $( "#interactivityAreaEvaluation" ).append("<div id=\"Evaluation\"></div>");
    
    $( "#Evaluation" ).height($("#interactivityAreaEvaluation").height() - $("#EvaluationToolbar").height() - 25);
	$( "#Evaluation" ).accordion({
        heightStyle:"content",
		collapsible: true,
		active: false
    });
    
    $("#addEvaluation")
        .button({text: true, label: 'Add Evaluation',icons:{primary:"ui-icon-circle-plus"}})
        .click(function(){
            openEvaluation({'session': pageData.session, "evaluationId": ""});
        });       
    
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
                $("#Evaluation").accordion("refresh");
            }   
        }
    });
    
	function evaluationShortAnswer(obj){
        $("#Evaluation").append("<h3 id=\"Evaluation" + obj.id + "\"><span style=\"display:block\">Evaluation Question</span></h3>");
        $("#Evaluation").append("<div id=\"evaluationQuestion" + obj.id + "\"><p>" + obj.question + "</p></div>");
		$("#Evaluation" + obj.id).append("<button id=\"evaluationQuestionButton" + obj.id + "P\"></button>");
		$("#Evaluation" + obj.id).append("<button id=\"evaluationQuestionButton" + obj.id + "E\"></button>");
		$("#Evaluation" + obj.id).append("<button id=\"evaluationQuestionButton" + obj.id + "D\"></button>");
	}
	
	function evaluationMultipleChoice(obj){
        $("#Evaluation").append("<h3 id=\"Evaluation" + obj.id + "\"><span style=\"display:block\">Evaluation Question</span></h3>");			
		$("#Evaluation").append("<div id=\"evaluationQuestion" + obj.id + "\"><p>" + obj.question + "</p></div>");
        evaluationOptions[obj.id]["optionNames"] = [];
		for (var n = 0; n < obj.options.length; n++) {
			$("#evaluationQuestion" + obj.id).append("<input type=\"checkbox\" id=\"evaluation" + obj.id + "Checkbox" + n + "\">" + "<label for=\"evaluation" + obj.id + "Checkbox" + n + "\">" + obj.options[n] + "</label>");
			evaluationOptions[obj.id]["optionNames"][n] = obj.options[n];
			evaluationOptions[obj.id][obj.options[n]] = 0;
		}
		$("#Evaluation" + obj.id).append("<button id=\"evaluationQuestionButton" + obj.id + "P\"></button>");
		$("#Evaluation" + obj.id).append("<button id=\"evaluationQuestionButton" + obj.id + "E\"></button>");
		$("#Evaluation" + obj.id).append("<button id=\"evaluationQuestionButton" + obj.id + "D\"></button>");
	}

	function evaluationButtonSet(obj){
        $("#evaluationQuestionButton" + obj.id + "P")
            .button({text: false, label: 'Share as Popup',icons:{primary:"ui-icon-circle-zoomin"}})
            .click({'id':obj.id}, function(res){
                $("#dialog-form").dialog("open");
                var evaluationContent = $("#evaluationQuestion" + res.data.id).html();
                $('#dialog-form1').append(evaluationContent);
            });
		$("#evaluationQuestionButton" + obj.id + "E")
            .button({text: false, label: 'Edit',icons:{primary:"ui-icon-wrench"}})
            .click({'id':obj.id}, function(res){
                openEvaluation({'session': pageData.session, 'evaluationId': obj.id});
                $("#inputEvaluationQuestion").val(obj.question);
                if (obj.options == 0) {
                    $('#radioEvaluationOptions label').eq(0).trigger("click");
                } else {
                    $('#radioEvaluationOptions label').eq(1).trigger("click");
                    for(var i=0; i < obj.options.length; i++) {
                        evaluationEditorOptionI[_iEvaluation] = 1;
                        var button = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"evaluationEditorOptionButton" + _iEvaluation + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
                        $("#evaluationEditorOption").append("<div id=\"evaluationEditorOption" + _iEvaluation + "\"></div>");
                        $("#evaluationEditorOption" + _iEvaluation).append("<label for=\"\">Option:</label><input id=\"evaluationEditorOptionInput" + _iEvaluation + "\" style=\"display:inline;width:90%;\" value=\"" + obj.options[i] + "\"></input>");
                        button.appendTo("#evaluationEditorOption" + _iEvaluation);
                        button.click(function(){
                            var id = $(this).attr('id');
                            evaluationEditorOptionI[id.substr(22, 23)] = 0;
                            $(this).parent().remove();
                        });
                        _iEvaluation++;
                    }	
                }
            });
		$("#evaluationQuestionButton" + obj.id + "D")
            .button({text: false, label: 'Delete',icons:{primary:"ui-icon-trash"}})
            .click({'id':obj.id}, function(res){
                var options;
                if ($(this).text() == "Delete") {
                    options = {label: "Undo", icons: {primary: "ui-icon-arrowreturnthick-1-w"}};
                    timeout = setTimeout(function() {	
                        $("#Evaluation").accordion({active:false});
                        $("#evaluationQuestion" + res.data.id).remove();
                        $("#Evaluation" + res.data.id).remove();
                        $.ajax({
                            type: "POST",
                            url: "evaluation/delete",
                            dataType: "json",
                            cache: false,
                            data: {"evaluationId": res.data.id},
                            success: function(res) {

                            }
                        });
                        options = {label: "Delete", icons: {primary: "ui-icon-trash"}};
                        socket.post('/socket/broadcast', {'event':'evaluationDelete', 'data':{"evaluationId": res.data.id}}, function(response) {console.log(response);});
                    },10000);						
                } else {
                    options = {label: "Delete", icons: {primary: "ui-icon-trash"}};
                    clearTimeout(timeout);
                }
                $( this ).button( "option", options );
            });		
	}
    
    $("#evaluationStart")
        .button({text: true, label: 'Evaluation',icons:{primary:"ui-icon-star"}})
        .click(function(){
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
        
	function openEvaluation(obj){
		$("#evaluationEditor").dialog("open");
		$("#evaluationIdLabel").text(obj.evaluationId);
	}           
        
	var evaluationEditorOptionI = Array(),
		_iEvaluation = 0;
        
	$("#radioEvaluationOptions")
        .buttonset()
        .change(function(){
            evaluationEditorOptionI = [];
            if ($("#radioEvaluationOptions2").is(':checked')) {
                $("#inputEvaluationOptions").show();
            } else {
                $("#inputEvaluationOptions").hide();
                $("#evaluationEditorOption").empty();
            }
        });
        
	$("#inputEvaluationOptions").hide();		
	$("#inputEvaluationOptions")
        .button({text: false, label: 'Add Options',icons:{primary:"ui-icon-plus"}})
        .click(function(){
            evaluationEditorOptionI[_iEvaluation] = 1;
            var button = $("<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only\" id=\"evaluationEditorOptionButton" + _iEvaluation + "\" style=\"display:inline\"><span class=\"ui-button-icon-primary ui-icon ui-icon-close\"></span><span class=\"ui-button-text\">Delete</span>");
            $("#evaluationEditorOption").append("<div id=\"evaluationEditorOption" + _iEvaluation + "\"></div>");
            $("#evaluationEditorOption" + _iEvaluation).append("<label for=\"\">Option:</label><input id=\"evaluationEditorOptionInput" + _iEvaluation + "\" style=\"display:inline;width:90%;\"></input>");
            button.appendTo("#evaluationEditorOption" + _iEvaluation);
            button.click(function(){
                var id = $(this).attr('id');
                evaluationEditorOptionI[id.substr(22, 23)] = 0;
//	get string after "_"		id.split("_")[1];
                $(this).parent().remove();
            });
            _iEvaluation++;
        });            

	$("#evaluationEditor").dialog({
        autoOpen:false,
        height:500,
        width:500,
        modal:true,
        close:function(){
            $("#evaluationEditorOption").empty();
            $("#inputEvaluationQuestion").val("");
            evaluationEditorOptionI = [];
            _iEvaluation=0;
        },
        buttons:{
            "Confirm": function() {
                var addEvaluationQuestion = {},
                    addEvaluationOption = 0,
                    options = [];
                addEvaluationQuestion.question = $("#inputEvaluationQuestion").val();
                if ($("#radioEvaluationOptions2").is(':checked')) {			
                    for (var i = 0; i < _iEvaluation ; i++) {
                        if (evaluationEditorOptionI[i] == 1) {
                            options.push($("#evaluationEditorOptionInput" + i).val());
                        } else {
                        }
                    }
                    addEvaluationQuestion.options = options;
                    addEvaluationOption = options.length;
                } else {
                    addEvaluationOption = 0;
                }
                if ($("#evaluationIdLabel").text() == "") {
                    $.ajax({
                        type: "POST",
                        url: "evaluation/add",
                        dataType: "json",
                        cache: false,
                        data: {"question": JSON.stringify(addEvaluationQuestion), "options": addEvaluationOption},
                        success: function(res) {
                            pageData.evaluation.push(res);
                            var evaluationQuestion = JSON.parse(res.question);
                            evaluationOptions[res.id] = res;
                            if (res.options === 0) {
                                evaluationShortAnswer({'id': res.id, 'i':0, 'question': evaluationQuestion.question, 'options': 0});
                                evaluationButtonSet({'id': res.id, 'i':0, 'question': evaluationQuestion.question, 'options': 0});
                            } else {
                                evaluationMultipleChoice({'id': res.id, 'i':0, 'question': evaluationQuestion.question, 'options':evaluationQuestion.options});
                                evaluationButtonSet({'id': res.id, 'i':0, 'question': evaluationQuestion.question, 'options':evaluationQuestion.options});
                            }                            
                            $("#Evaluation").accordion("refresh");
                            socket.post('/socket/broadcast', {'event':'evaluationEdit', 'data':{"question": JSON.stringify(addEvaluationQuestion), "options": addEvaluationOption, "evaluationId": res.id}}, function(response) {console.log(response);});
                        }
                    });								
                } else {
                    $.ajax({
                        type: "POST",
                        url: "evaluation/update",
                        dataType: "json",
                        cache: false,
                        data: {"question": JSON.stringify(addEvaluationQuestion), "options": addEvaluationOption, "evaluationId": $("#evaluationIdLabel").text()},
                        success: function(res) {
                            $("#Evaluation").accordion({active:false});
                            $("#evaluationQuestion" + res[0].id).remove();
                            $("#Evaluation" + res[0].id).remove();
                            pageData.evaluation.push(res[0]);
                            var evaluationQuestion = JSON.parse(res[0].question);
                            evaluationOptions[res[0].id] = res[0];
                            if (res[0].options === 0) {
                                evaluationShortAnswer({'id': res[0].id, 'i':0, 'question': evaluationQuestion.question, 'options': 0});
                                evaluationButtonSet({'id': res[0].id, 'i':0, 'question': evaluationQuestion.question, 'options': 0});
                            } else {
                                evaluationMultipleChoice({'id': res[0].id, 'i':0, 'question': evaluationQuestion.question, 'options':evaluationQuestion.options});
                                evaluationButtonSet({'id': res[0].id, 'i':0, 'question': evaluationQuestion.question, 'options':evaluationQuestion.options});
                            }                                  
                            $("#Evaluation").accordion("refresh");
                            socket.post('/socket/broadcast', {'event':'evaluationEdit', 'data':{"question": JSON.stringify(addEvaluationQuestion), "options": addEvaluationOption, "evaluationId": res.id}}, function(response) {console.log(response);});
                        }
                    });								
                }
                $("#evaluationEditorOption").empty();
                evaluationEditorOptionI = [];
                _iEvaluation=0;
                $("#evaluationEditor").dialog("close");
            },
            Cancel: function() {
                $("#evaluationEditorOption").empty();
                evaluationEditorOptionI = [];
                _iEvaluation=0;
                $("#evaluationEditor").dialog("close");
            }
        }
	});

	socket.on('evaluationDialog', function(res) {
		if (res.data.OrC == "Display") {
			$("#dialog-form").dialog("open");
			var quizContent = $("#evaluationQuestion" + res.data.class + res.data.id).html();
			$('#dialog-form1').append(quizContent);					
		} else {
			$("#dialog-form").dialog("close");
		}		
	});    
    
    //-------------------------------------------
    // grouppower settings below
    //-------------------------------------------
	
	var chatContentText = Array();
		chatContentTextWC = ["", "", "", "", ""];
		chatKeyWords = {"group0":{}, "group1":{}, "group2":{}, "group3":{}, "group4":{}};
	
    $("#interactivityItemGroupPower")
        .click(function(){
            $("#dialog-grouppower").dialog("open").dialogExtend(dialogExtendOptions);
            socket.post('/socket/broadcast', {'event':'chatOpen', 'data':{}}, function(response) {console.log(response);});				
        });		
	
	$("#dialog-grouppower").dialog({
		autoOpen:false,
		height:0.9*$(window).height(),
		width:0.9*$(window).width(),
		modal:false,
		closeOnEscape: true,
		open: function(event, ui) {
			$("#chatTabs").tabs({});
			$("#chatSlideArea img").attr("width", $("#chatTabs div.ui-tabs-panel[aria-hidden='false']").width());
			$("#chatSlideArea img").attr("src", pageData.page.image[pageData.session.currentPage - 1]);
			$("#group0Svg").attr("width", $("#chatTabs div.ui-tabs-panel[aria-hidden='false']").width()*0.9);
			$("#group0Svg").attr("height", $("#chatTabs div.ui-tabs-panel[aria-hidden='false']").height()*0.9);
			$("#group0g").attr("width", $("#chatTabs div.ui-tabs-panel[aria-hidden='false']").width()*0.9);
			$("#group0g").attr("height", $("#chatTabs div.ui-tabs-panel[aria-hidden='false']").height()*0.9);					
		},
		close: function(event, ui) {
            $("#interactivityAreaGroupPower").hide();
            $(".interactivityItem").css('background-color','#cccccc');
        },
		buttons: {
			"New": function(){
				if (confirm("Clear all chat?")) {
					$("#chatContent").empty();
					$("#chatContent1").empty();
					$("#chatContent2").empty();
					$("#chatContent3").empty();
					$("#chatContent4").empty();
					socket.post('/socket/broadcast', {'event':'chatNew', 'data':{}}, function(response) {console.log(response);});
					chatContentTextWC = [" ", " ", " ", " ", " "];
					chatKeyWords = {"group0":{}, "group1":{}, "group2":{}, "group3":{}, "group4":{}};
					$(".chatKeywordsLi").remove();
					for (var i=0; i<5; i++) {
						function clearChat(n){setTimeout(function() {generateD3WordCloud(chatContentTextWC[n], "" + n)}, n*1000)};
						clearChat(i);
					}
				}	
			},
			"Split": function(){
				if ($("#chatGroupNumber").val() != 0) {
					$.ajax({
						type: "POST",
						url: "chat/split",
						dataType: "json",
						cache: false,
						data: {"participantNumber": pageData.session.currentParticipant, "groupNumber": $("#chatGroupNumber").val()},
						success: function(response) {
							socket.post('/socket/broadcast', {'event':'chatSplit', 'data':{}}, function(response) {console.log(response);});
						}
					});	
					for(var i=0; i < $("#chatGroupNumber").val(); i++) {
						$("#dialog-grouppower" + (i+1)).dialog("open").dialogExtend(dialogExtendOptions);
					}
					$("#dialog-grouppower").dialog("close");
				}
			},
			"Close": function(){
				$("#dialog-grouppower").dialog("close");
			}
		}
	});
	
	$("#dialog-grouppower1").dialog({
		autoOpen:false,
		height:0.5*$(window).height(),
		width:0.5*$(window).width(),
		position: {at: 'left top'},
		modal:false,
		closeOnEscape: true,
		open: function(event, ui) {		
		},
		close: function(event, ui) {},
		buttons: {
			"Merge": function(){
				$("#dialog-grouppower1").dialog("close");
				$("#dialog-grouppower2").dialog("close");
				$("#dialog-grouppower3").dialog("close");
				$("#dialog-grouppower4").dialog("close");
				$("#dialog-grouppower").dialog("open");
				socket.post('/socket/broadcast', {'event':'chatJoin', 'data':{}}, function(response) {console.log(response);});
				generateD3WordCloud(chatContentTextWC[0], "0");
				$.ajax({
					type: "POST",
					url: "chat/deletegroup",
					dataType: "json",
					cache: false,
					data: {},
					success: function(response) {
						
					}
				});					
			}
		}
	});
	
	$("#dialog-grouppower2").dialog({
		autoOpen:false,
		height:0.5*$(window).height(),
		width:0.5*$(window).width(),
		position: {at: 'right top'},
		modal:false,
		closeOnEscape: true,
		open: function(event, ui) {
		},
		close: function(event, ui) {},
		buttons: {
			"Merge": function(){
				$("#dialog-grouppower1").dialog("close");
				$("#dialog-grouppower2").dialog("close");
				$("#dialog-grouppower3").dialog("close");
				$("#dialog-grouppower4").dialog("close");
				$("#dialog-grouppower").dialog("open");
				generateD3WordCloud(chatContentTextWC[0], "0");
				$.ajax({
					type: "POST",
					url: "chat/deletegroup",
					dataType: "json",
					cache: false,
					data: {},
					success: function(response) {
						
					}
				});					
			}
		}
	});

	$("#dialog-grouppower3").dialog({
		autoOpen:false,
		height:0.5*$(window).height(),
		width:0.5*$(window).width(),
		position: {at: 'left bottom'},
		modal:false,
		closeOnEscape: true,
		open: function(event, ui) {		
		},
		close: function(event, ui) {},
		buttons: {
			"Merge": function(){
				$("#dialog-grouppower1").dialog("close");
				$("#dialog-grouppower2").dialog("close");
				$("#dialog-grouppower3").dialog("close");
				$("#dialog-grouppower4").dialog("close");
				$("#dialog-grouppower").dialog("open");
				generateD3WordCloud(chatContentTextWC[0], "0");
				$.ajax({
					type: "POST",
					url: "chat/deletegroup",
					dataType: "json",
					cache: false,
					data: {},
					success: function(response) {
						
					}
				});					
			}
		}
	});

	$("#dialog-grouppower4").dialog({
		autoOpen:false,
		height:0.5*$(window).height(),
		width:0.5*$(window).width(),
		position: {at: 'right bottom'},
		modal:false,
		closeOnEscape: true,
		open: function(event, ui) {
		},
		close: function(event, ui) {},
		buttons: {
			"Merge": function(){
				$("#dialog-grouppower1").dialog("close");
				$("#dialog-grouppower2").dialog("close");
				$("#dialog-grouppower3").dialog("close");
				$("#dialog-grouppower4").dialog("close");
				$("#dialog-grouppower").dialog("open");			
				generateD3WordCloud(chatContentTextWC[0], "0");
				$.ajax({
					type: "POST",
					url: "chat/deletegroup",
					dataType: "json",
					cache: false,
					data: {},
					success: function(response) {
						
					}
				});					
			}
		}
	});		
	
	$("#chatTextEnter")
		.button()
		.click(function(){
			var str = $("#chatTextarea").val();
			var words = str.split(" ");
			chatContentTextWC[0] += str;
			chatContentTextWC[0] += " ";
			getKeyWords($("#chatTextarea").val(), "0");
 			$("#chatContent").append("<p>Anonymous: " + $("#chatTextarea").val() + "</p>");
			socket.post('/socket/broadcast', {'event':'chatContentBroadcast', 'data':{"content": $("#chatTextarea").val(), "user": "Anonymous", "group": 0}}, function(response) {console.log(response);});
			$("#chatTextarea").val("");
			$("#chatContent").scrollTop($("#chatContent")[0].scrollHeight);	
			console.log(chatContentTextWC[0]);
			generateD3WordCloud(chatContentTextWC[0], "0");
		});
		
	$("#chatTextEnter1")
		.button()
		.click(function(){
			$("#group1Svg").attr("width", $("#chatWordCloudArea1").width());
			$("#group1Svg").attr("height", $("#chatWordCloudArea1").height());			
			chatContentTextWC[1] += $("#chatTextarea1").val();
			chatContentTextWC[1] += " ";
			chatContentTextWC[0] += chatContentTextWC[1];
			getKeyWords($("#chatTextarea1").val(), "1");
			$("#chatContent").append("<p>Anonymous: " + $("#chatTextarea1").val() + "</p>");
			$("#chatContent1").append("<p>Anonymous: " + $("#chatTextarea1").val() + "</p>");
			socket.post('/socket/broadcast', {'event':'chatContentBroadcast', 'data':{"content": $("#chatTextarea1").val(), "user": "Anonymous", "group": 1}}, function(response) {console.log(response);});
			$("#chatTextarea1").val("");
			$("#chatContent1").scrollTop($("#chatContent1")[0].scrollHeight);
			generateD3WordCloud(chatContentTextWC[1], "1");
		});

	$("#chatTextEnter2")
		.button()
		.click(function(){
			chatContentTextWC[2] += $("#chatTextarea2").val();
			chatContentTextWC[2] += " ";
			chatContentTextWC[0] += chatContentTextWC[2];
			getKeyWords($("#chatTextarea2").val(), "2");
			$("#chatContent").append("<p>Anonymous: " + $("#chatTextarea2").val() + "</p>");
			$("#chatContent2").append("<p>Anonymous: " + $("#chatTextarea2").val() + "</p>");
			socket.post('/socket/broadcast', {'event':'chatContentBroadcast', 'data':{"content": $("#chatTextarea2").val(), "user": "Anonymous", "group": 2}}, function(response) {console.log(response);});
			$("#chatTextarea2").val("");
			$("#chatContent2").scrollTop($("#chatContent2")[0].scrollHeight);	
			generateD3WordCloud(chatContentTextWC[2], "2");
		});

	$("#chatTextEnter3")
		.button()
		.click(function(){
			chatContentTextWC[3] += $("#chatTextarea3").val();
			chatContentTextWC[3] += " ";
			chatContentTextWC[0] += chatContentTextWC[3];
			getKeyWords($("#chatTextarea3").val(), "3");
			$("#chatContent").append("<p>Anonymous: " + $("#chatTextarea3").val() + "</p>");
			$("#chatContent3").append("<p>Anonymous: " + $("#chatTextarea3").val() + "</p>");
			socket.post('/socket/broadcast', {'event':'chatContentBroadcast', 'data':{"content": $("#chatTextarea3").val(), "user": "Anonymous", "group": 3}}, function(response) {console.log(response);});
			$("#chatTextarea3").val("");
			$("#chatContent3").scrollTop($("#chatContent3")[0].scrollHeight);
			generateD3WordCloud(chatContentTextWC[3], "3");
		});

	$("#chatTextEnter4")
		.button()
		.click(function(){
			chatContentTextWC[4] += $("#chatTextarea4").val();
			chatContentTextWC[4] += " ";
			chatContentTextWC[0] += chatContentTextWC[4];
			getKeyWords($("#chatTextarea4").val(), "4");
			$("#chatContent").append("<p>Anonymous: " + $("#chatTextarea4").val() + "</p>");
			$("#chatContent4").append("<p>Anonymous: " + $("#chatTextarea4").val() + "</p>");
			socket.post('/socket/broadcast', {'event':'chatContentBroadcast', 'data':{"content": $("#chatTextarea4").val(), "user": "Anonymous", "group": 4}}, function(response) {console.log(response);});
			$("#chatTextarea4").val("");
			$("#chatContent4").scrollTop($("#chatContent4")[0].scrollHeight);
			generateD3WordCloud(chatContentTextWC[4], "4");
		});		
		
    socket.on('chatContentBroadcast', function(res) {
		getKeyWords(res.data.content, res.data.group);
		$("#chatContent").append("<p>" + res.data.user + ": " + res.data.content + "</p>");
		$("#chatContent").scrollTop($("#chatContent")[0].scrollHeight);
        $("#chatContent" + res.data.group).append("<p>" + res.data.user + ": " + res.data.content + "</p>");
		$("#chatContent" + res.data.group).scrollTop($("#chatContent")[0].scrollHeight);
		switch (res.data.group) {
			case 0:
				chatContentTextWC[0] += res.data.content;
				chatContentTextWC[0] += " ";
				console.log(chatContentTextWC[0]);
				getKeyWords(res.data.content, "0");
				generateD3WordCloud(chatContentTextWC[0], "0");	
				break
			case 1:
				chatContentTextWC[1] += res.data.content;
				chatContentTextWC[1] += " ";
				chatContentTextWC[0] += chatContentTextWC[1];
				generateD3WordCloud(chatContentTextWC[1], "1");
				getKeyWords(res.data.content, "1");
				break;
			case 2:
				chatContentTextWC[2] += res.data.content;
				chatContentTextWC[2] += " ";
				chatContentTextWC[0] += chatContentTextWC[2];
				generateD3WordCloud(chatContentTextWC[2], "2");
				getKeyWords(res.data.content, "2");
				break;
			case 3:
				chatContentTextWC[3] += res.data.content;
				chatContentTextWC[3] += " ";
				chatContentTextWC[0] += chatContentTextWC[3];
				generateD3WordCloud(chatContentTextWC[3], "3");
				getKeyWords(res.data.content, "3");
				break;
			case 4:
				chatContentTextWC[4] += res.data.content;
				chatContentTextWC[4] += " ";
				chatContentTextWC[0] += chatContentTextWC[4];
				generateD3WordCloud(chatContentTextWC[4], "4");
				getKeyWords(res.data.content, "4");
				break;				
		}
    });
	
	socket.on('chatNew', function(res) {
		$("#chatContent").empty();
		chatContentTextWC = [" ", " ", " ", " ", " "];
		chatKeyWords = {"group0":{}, "group1":{}, "group2":{}, "group3":{}, "group4":{}};
		$(".chatKeywordsLi").remove();
		generateD3WordCloud(chatContentTextWC[0], "0");		
	});	
	
	socket.on('chatSplit', function(res) {	
		for(var i=0; i < res.data.groupNumber; i++) {
			$("#dialog-grouppower" + (i+1)).dialog("open").dialogExtend(dialogExtendOptions);
		}
	});	

	socket.on('chatSplitRequest', function(res) {
		chatGroup[i];
	});
	
	function getKeyWords(text, group){
		var keyWords = "";
		var tags = parseText(text);
		for (var i=0; i<tags.length; i++) {
			if (tags[i].text) {
				if (tags[i].text in chatKeyWords.group0) {				
					switch (group) {
						case "0":
							chatKeyWords.group0[tags[i].text] += 1;
							break;
						case "1":
							chatKeyWords.group1[tags[i].text] += 1;
							chatKeyWords.group0[tags[i].text] += 1;
							break;
						case "2":
							chatKeyWords.group2[tags[i].text] += 1;
							chatKeyWords.group0[tags[i].text] += 1;
							break;
						case "3":
							chatKeyWords.group3[tags[i].text] += 1;
							chatKeyWords.group0[tags[i].text] += 1;
							break;
						case "4":
							chatKeyWords.group4[tags[i].text] += 1;
							chatKeyWords.group0[tags[i].text] += 1;
							break;				
					}					
				} else {
					switch (group) {
						case "0":
							chatKeyWords.group0[tags[i].text] = 1;
							$("#chatKeyWordArea").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							break;					
						case "1":
							chatKeyWords.group1[tags[i].text] = 1;
							chatKeyWords.group0[tags[i].text] = 1;
							$("#chatKeyWordArea").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							$("#chatKeyWordArea1").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							break;
						case "2":
							chatKeyWords.group2[tags[i].text] = 1;
							chatKeyWords.group0[tags[i].text] = 1;
							$("#chatKeyWordArea").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							$("#chatKeyWordArea2").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							break;
						case "3":
							chatKeyWords.group3[tags[i].text] = 1;
							chatKeyWords.group0[tags[i].text] = 1;
							$("#chatKeyWordArea").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							$("#chatKeyWordArea3").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							break;
						case "4":
							chatKeyWords.group4[tags[i].text] = 1;
							chatKeyWords.group0[tags[i].text] = 1;
							$("#chatKeyWordArea").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							$("#chatKeyWordArea4").append("<li class=\"chatKeywordsLi\">" + tags[i].text + "</li>");
							break;				
					}						
				}
			}
		}
	}
    
    //-------------------------------------------
    // slidetag settings below
    //-------------------------------------------

    $("#interactivityAreaSlideTag").append("<form></form>");
    $("#interactivityAreaSlideTag form").append("<div id=\"slideRatingRadio\"></div>")
    $("#slideRatingRadio").append("<input type=\"radio\" id=\"slideRatingRadio1\" value=\"0\" name=\"slideRatingRadio\"  checked=\"checked\"><label for=\"slideRatingRadio1\">None</label>");
    $("#slideRatingRadio").append("<input type=\"radio\" id=\"slideRatingRadio2\" value=\"1\" name=\"slideRatingRadio\"><label for=\"slideRatingRadio2\">Important</label>");
    $("#slideRatingRadio").append("<input type=\"radio\" id=\"slideRatingRadio3\" value=\"2\" name=\"slideRatingRadio\"><label for=\"slideRatingRadio3\">Very Important</label>");
    $("#interactivityAreaSlideTag").append("<div id=\"slideRatingText\"></div>");
    $("#slideRatingText").append("<textarea id=\"slideRatingTextarea\"></textarea>");
    $("#slideRatingText").append("<button id=\"slideRatingTextareaButton\">Save</button>");
    
    $("#slideRatingRadio").buttonset();
    $("#slideRatingTextareaButton")
        .button()
        .click(function () {
            if ($("#slideRatingTextarea").val() == "") {
            
            } else {
                $.ajax({
                    type: "POST",
                    url: "filemodify/rating",
                    dataType: "json",
                    cache: false,
                    data: {"fileId": pageData.page.id[pageData.session.currentPage - 1], "rating": $("input[name=slideRatingRadio]:checked").val(), "info": $("#slideRatingTextarea").val()},
                    success: function(response) {
                        socket.post('/socket/broadcast', {'event':'slideRating', 'data': response}, function(response) {});
                        alert('Success');
                    }
                });
            }				
        });
    
    $("#interactivityItemSlideTag").click(function () {
        slideRating();
    });
    
	function slideRating() {
        $.ajax({
            type: "GET",
            url: "filemodify/getrating",
            dataType: "json",
            cache: false,
            data: {"fileId": pageData.page.id[pageData.session.currentPage - 1]},
            success: function(response) {
                if(response.error) {
                    $("input[name=slideRatingRadio][value='0']").prop('checked', true).button("refresh");
                    $("#slideRatingTextarea").val("");	
                } else {
                    $("input[name=slideRatingRadio][value='" + response.data.rating + "']").prop('checked', true).button("refresh");
                    $("#slideRatingTextarea").val(response.data.info);					
                }					
            }
        });	
	}
	
/*	socket.on('slideTagReceive', function(res){
		getDashboardInfo();
	});     */
    
    //-------------------------------------------
    // reference settings below
    //-------------------------------------------
    
    $("#tagTranslate").hide();
    
	function tagList(page) {
		$.ajax({
			type: "POST",
			url: "translation/getkeywords",
			dataType: "json",
			cache: false,
			data: {"fileId": pageData.session.slides[page].fileId, "page": pageData.session.currentFilePage},
			success: function(response) {
				if (response.msg) {
				
				} else{		
				//	$("#customTranslationList" + page).empty();
				//	$("#customTranslationList" + page).remove();
                    $("#referenceArea").empty();
                    $("#referenceArea").append("<ul class=\"customTranslationList customTranslationList" + page + "\" id=\"customTranslationList" + page + "\"></ul>");	
					$("#customTranslationCloud").append("<ul class=\"customTranslationList customTranslationList" + page + "\" id=\"customTranslationList" + page + "\"></ul>");						
					$.each(response.tags, function(i, val) {
						if (/^[a-zA-Z ]+$/.test(val.tag)) {
								var tagTranslation = '';
								var li = $("<li class=\"tag-" + val.classify + "\" id=" + page + "Page" + i + ">"),
									label = $("<label style=\"font-size:120%;margin-left:5px;\" id=\"customTranslationLabel" + page + "Page" + i + "\">"),
									input = $("<input style=\"display:none;\" id=\"customTranslationInput" + page + "Page" + i + "\"></input>"),
									button = $("<button style=\"display:none;\" id=\"customTranslationButton" + page + "Page" + i + "\">Add custom meaning</button>"),
									labelCustom = $("<label style=\"font-size:120%;margin-left:5px;\" id=\"customTranslationLabelCustom" + page + "Page" + i + "\">");
								$("<a style=\"font-size:120%;margin-left:2px;color:#000099;\">").text(val.tag).appendTo(li);
								li.appendTo("#customTranslationList" + page);
								label.appendTo("#customTranslationList" + page);
								input.appendTo("#customTranslationList" + page);
								button.appendTo("#customTranslationList" + page);
								labelCustom.appendTo("#customTranslationList" + page);
								li.click({'word':val.tag,'language': ''}, function(res){
									if ($("#customTranslationLabel" + page + "Page" + i).text() == '') {
										$.ajax({
											type: "GET",
											url: "translation/translate",
											dataType: "json",
											data: {"word": res.data.word, "language": "en_wiki"},
											success: function (response) {
												if (response.error) {
													$("#customTranslationLabel" + page + "Page" + i).append("<a>Not available</a>");
												} else {
													tagTranslation = JSON.parse(response.translation).join(",");
													$("#customTranslationLabel" + page + "Page" + i).append("<a>" + tagTranslation + "</a>");
												}
												$("#customTranslationLabel" + page + "Page" + i).show();
												$("#customTranslationInput" + page + "Page" + i).show();
												$("#customTranslationButton" + page + "Page" + i).show();												
											}
										});
										$.ajax({
											type: "GET",
											url: "translation/getcustom",
											dataType: "json",
											data: {"word": res.data.word},
											success: function (response) {
												if (response.error) {
													$("#customTranslationLabelCustom" + page + "Page" + i).append("<a>Not available</a>");
												} else {
													$("#customTranslationLabelCustom" + page + "Page" + i).append("<a>" + response.translation + "</a>");
													$("#customTranslationInput" + page + "Page" + i).val(response.translation);
												}
												$("#customTranslationLabelCustom" + page + "Page" + i).show();											
											}
										});										
									} else {
										
									}
									if ($("#customTranslationLabel" + page + "Page" + i).is(':hidden') === true) {
										$("#customTranslationLabel" + page + "Page" + i).show();
										$("#customTranslationInput" + page + "Page" + i).show();
										$("#customTranslationButton" + page + "Page" + i).show();
										$("#customTranslationLabelCustom" + page + "Page" + i).show();
									} else {
										$("#customTranslationLabel" + page + "Page" + i).hide();
										$("#customTranslationInput" + page + "Page" + i).hide();
										$("#customTranslationButton" + page + "Page" + i).hide();
										$("#customTranslationLabelCustom" + page + "Page" + i).hide();
									}										
								});
								button.click({'word':val.tag}, function(res){
									if ($("#customTranslationInput" + page + "Page" + i).val() == '') {

									} else {
										$.ajax({
											type: "POST",
											url: "translation/savecustom",
											dataType: "json",
											data: {"userId": pageData.session.userId, "sessionId": pageData.session.sessionId, "word": res.data.word, "translation": $("#customTranslationInput" + page + "Page" + i).val()},
											success: function (response) {
												console.log(response);
												$("#customTranslationLabelCustom" + page + "Page" + i + " a").text(response.translation);
											}
										});	
									}								
								});
						} else {
						
						}
					});
				}					
			}
		});				
	}   
});