$(function() {
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined" && typeof pageData.session.slides != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){
                pageData.session.currentPage = slideIndex + 1;
                pageData.session.currentFileName = pageData.session.slides[slideIndex].name;
                pageData.session.currentFileId = pageData.session.slides[slideIndex].fileId;
                pageData.session.currentFilePage = pageData.session.slides[slideIndex].page + 1;
                
                $("#nextSlideArea img").attr("src", pageData.page.image[slideIndex + 1]);
                $("#nextSlideArea img").attr("height", 200);
                
                getQuestion();
            });

            clearInterval(loop);
        }
    }, 30);

    //-------------------------------------------
    // Filelists settings below
    //-------------------------------------------
    
	$.ajax({
		type: "GET",
		url: "session/getuploadedfiles",
		dataType: "json",
		cache: false,
		data: {"sessionId": pageData.session.sessionId},
		success: function(response) {
			pageData.file = response;
			var filepage = 0,
				slides = [];
			for (var i = 0; i < response.length; i++) {
				if (response[i].type == "pdf") {
					var li = $("<li>");
					for (var n = filepage; n < filepage + response[i].size; n++) {
						slides[n] = {"name":response[i].name, "page":n - filepage, "fileId": response[i].id, "startPage": filepage, "totalPage": response[i].size};
					}
					var name = Array();
					var fileName;
					name = response[i].name.split(".");
					fileName = name.pop();			
					switch (fileName) {
						case "ppt":
						case "pptx":
							$("<img src=\"/styles/images/powerpointIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
							break;
						case "doc":
						case "docx":
							$("<img src=\"/styles/images/wordIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
							break;					
						case "xls":
						case "xlsx":
							$("<img src=\"/styles/images/excelIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
							break;				
						case "pdf":
							$("<img src=\"/styles/images/pdfIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
							break;					
						default:
							break;
					}
					$("<a href=\"" + "#" + "\">").text(response[i].name + ": Page " + (filepage+1) + " - " + (filepage+response[i].size)).appendTo(li);
					li.click({"name":response[i].name,"page": filepage}, function(obj){
						jssor_slider1.$GoTo(obj.data.page);
					});
					li.appendTo("#multiplefiles");
					filepage += response[i].size;
				} else if (response[i].type == "url") {
					var li = $("<li>");
                    $("<img src=\"/styles/images/icons-png/wwwIcon.png\" style=\"height:20px;width:20px;\">").appendTo(li);
					if (response[i].location.substring(0, 4) == "http") {
						$("<a onclick=\"window.open('" + response[i].location + "', '_blank','height:auto;width:auto;');\">").text(response[i].name).appendTo(li);
					} else {
						$("<a onclick=\"window.open('http://" + response[i].location + "', '_blank','height:auto;width:auto;');\">").text(response[i].name).appendTo(li);
					}
					li.appendTo("#resourceUrls");
				} else {
					
				}		
			}
			pageData.session.slides = slides;
		}
	});        
    
	$("#dialog-filelist").dialog({
		autoOpen:false,
		width: 0.3 * window.innerWidth,
		modal:false,
		position: {at: 'left bottom'},
		closeOnEscape: false,
		open: function(event,ui) {},
		close: function(event, ui) {},
		buttons: {}	
	});
    
    $("#controlItemFileList").click(function () {
        $("#dialog-filelist").dialog("open").dialogExtend(dialogExtendOptions);
    });

    //-------------------------------------------
    // Annotation settings below
    //-------------------------------------------
    
	var canvasHeight,
		canvasWidth,
		canvasImgParam = {};    
    
    var annotationAction = {};  
    var canvasObj = {};
    window.canvasObj = canvasObj;
    window.annotationAction = annotationAction;
    var annotationHeightRate = 1;
    var annotationWidthRate = 1;
    window.annotationHeightRate = annotationHeightRate;
    window.annotationWidthRate = annotationWidthRate;

    for (var i = 0; i<pageData.session.totalPage; i++) {
        annotationAction[i+1] = [];
    }
    
    $("#controlItemAnnotation").click(function () {
        initialAnnotation(pageData.session.currentPage);
    });
    
    function initialAnnotation(page) {
        $("#colors_demo").css({
            position: "absolute",
            width: $("#slider1_container").width(),
            left: (window.innerWidth - $("#slider1_container").width())/2,
            zIndex: 9999
        });
        $("#colors_sketch").css({
            position: "absolute",
            width: $("#colors_demo").width(),
            left: "0px",
            zIndex: 9998
        });
        $("#colors_sketch2").css({
            position: "absolute",
            width: $("#colors_sketch").width(),
            left: "0px",
            zIndex: 9999
        });				
       
        canvasHeight = window.innerHeight - 25 - $(".tools").height();
        canvasWidth = $("#slider1_container").width();	
        $("#colors_sketch").attr("height", canvasHeight);
        $("#colors_sketch").attr("Width", canvasWidth);			
        $("#colors_sketch2").attr("height", canvasHeight);
        $("#colors_sketch2").attr("Width", $("#colors_sketch").width());					
        $("#canvasDownload").attr("data-download1", page);
        
        canvasImgParam.name = pageData.page.image[page - 1].split("/")[3];
        canvasImgParam.left = ($("#colors_sketch").width() - $("#slider1_container").width())/2;
        canvasImgParam.top = (0-$(".tools").height());
        canvasImgParam.width = $("#slider1_container").width();
        canvasImgParam.height = $(".slideImg").height()/$(".slideImgArea").height()*$("#slider1_container").height();
        
        $('#colors_sketch').sketch(canvasImgParam);   
    }
    window.initialAnnotation = initialAnnotation;
    
	$(function() {
		$.each(['#f00','#000'], function() {
			$('#colors_demo .tools').append("<a href='#colors_sketch' data-color='" + this + "' style='width: 10px; background: " + this + ";'>Click</a> ");
		});
	});		    
    
    //-------------------------------------------
    // question settings below
    //-------------------------------------------
    
    $("#interactivityAreaQuestion").append("<div class=\"ui-widget ui-widget-content\" id=\"displayQuestion\"></div>");
    $("#interactivityAreaQuestion").append("<textarea id=\"submitQuestionArea\"></textarea>");
    $("#interactivityAreaQuestion").append("<button id=\"submitQuestion\">Submit</button>");
    
    $("#interactivityItemQuestion").click(function () {
        $("#submitQuestionArea").css('width', $("#displayQuestion").width());
    });    

    $("#interactivityAreaQuestion").resize(function () {
        $("#submitQuestionArea").css('width', $("#displayQuestion").width());
    });    

    function getQuestion() {
        $(".comment").hide();
        $.ajax({
            type: "GET",
            url: "comment/find",
            dataType: "json",
            cache: false,
            data: {"sessionId": pageData.session.sessionId, "page": pageData.session.currentPage},
            success: function(response) {
                if ($(".comment" + pageData.session.currentPage).length) {
                    $(".comment" + pageData.session.currentPage).show();
                } else {
                    for (var i = 0; i < response.length; i++) {	
                        var li = $("<li class=\"comment comment" + response[i].page + "\"></li>");
                        $("<a>").text(response[i].content).appendTo(li);
                        li.appendTo("#displayQuestion");
                    }
                }
            }
        });
    }
    
    var questionStartPage = 0;
    
    $("#submitQuestionArea").keydown(function(){
        if ($("#submitQuestionArea").val() == '') {
            questionStartPage = pageData.session.currentPage;
        } else {
        
        }	
    });    
    
    $("#submitQuestion")
        .button()
        .click(function () {
            if ($("#submitQuestionArea").val() == '') {
                alert("Please Enter Question Before Submit!");
            } else {
                if (pageData.session.currentPage == questionStartPage) {
                    $.ajax({
                        type: "POST",
                        url: "comment/submit",
                        dataType: "json",
                        cache: false,
                        data: {"page": questionStartPage, "content": $("#submitQuestionArea").val()},
                        success: function(response) {
                            $("#submitQuestionArea").val('');
                            alert("Question submitted!");
                        }
                    });
                } else {
                    $("#dialog-alert").dialog("open");
                    $("#alerts").append("<label style=\"color:#000099;\"><br>Page changed! <br><br> Submit to</label>");
                    $("#alerts").append("<p id=\"alertsType\" style=\"display:none;\">comment</p>");
                    $('.my-dialog .ui-button-text:contains(Confirm)').text('Previous: Page ' + questionStartPage);
                    $('.my-dialog .ui-button-text:contains(Cancel)').text('Current: Page ' + pageData.session.currentPage);
                }
            }
        });
    
    //-------------------------------------------
    // evaluation settings below
    //-------------------------------------------      
    
    //-------------------------------------------
    // quiz settings below
    //-------------------------------------------
    
    //-------------------------------------------
    // reference settings below
    //-------------------------------------------

    $("#interactivityAreaReference").append("<div id=\"tagTranslate\"></div>");
    $("#interactivityAreaReference").append("<div id=\"referenceArea\"></div>");
    $("#tagTranslate").append("<label for=\"comboboxLanguage\" style=\"font-size:150%;\">Choose Language:</label>");
    $("#tagTranslate").append("<select id=\"comboboxLanguage\" style=\"margin:12px 5px 12px 5px;\"></select>");
    $("#comboboxLanguage").append("<option value=\"\">Select One...</option>");
    $("#comboboxLanguage").append("<option value=\"en_wiki\">English Wiki</option>");
    $("#comboboxLanguage").append("<option value=\"med\">Medical</option>");
    $("#comboboxLanguage").append("<option value=\"en_zh\">Chinese</option>");
    $("#comboboxLanguage").append("<option value=\"jpn\">Japanese</option>");
    $("#comboboxLanguage").append("<option value=\"en_kor\">Korean</option>");
    $("#comboboxLanguage").append("<option value=\"en_viet\">Vietnamese</option>");

    //-------------------------------------------
    // general settings below
    //-------------------------------------------
    
    $("#controlItemSwitchtoMobile").click(function () {
        window.location.href = self.location + 'm';
    });    
    
    $("#controlItemDuplicate").click(function () {
        window.open(''+self.location,'Display','left=20,top=20,width=1024,height=768,status=0, addressbar=0,menubar=0,location=1,toolbar=0,resizable=0');
    });        

	$("#dialog-form").dialog({
        autoOpen:false,
        height:0.7*$(window).height(),
        width:0.6*$(window).width(),
        modal:false,
        close:function(){
            $("#dialog-form1").empty();
        }
	});

	var fontSize = 200,
		inlineHeight = 200;
    $("#dialog-formfsi")
            .button({text: false, label: 'Increase Font Size',icons:{primary:"ui-icon-plus"}})
            .click(function(){
				fontSize += 10;
				inlineHeight += 10;
				$("#dialog-form1").css("font-size", fontSize + "%");
				$("#dialog-form1").css("inline-height", inlineHeight + "%");
			});
			
    $("#dialog-formfsd")
            .button({text: false, label: 'Decrease Font Size',icons:{primary:"ui-icon-minus"}})
            .click(function(){
				fontSize -= 10;
				$("#dialog-form1").css("font-size", fontSize + "%");
				$("#dialog-form1").css("inline-height", inlineHeight + "%");
			});

    $("#dialog-alert").dialog({
        autoOpen:false,
        height:150,
        width:300,
        modal:true,
        closeOnEscape: false,
        close: function(event, ui) {
                $("#alerts").empty();
                $('.my-dialog .ui-button-text:contains(Previous)').text('Confirm');
                $('.my-dialog .ui-button-text:contains(Current)').text('Cancel');
            },
        buttons: {
                Confirm: function() {
                    if ($("#alertsType").text() == 'comment') {
                        alertDialog({"type": 'comment', "page": questionStartPage});
                    }
                    $("#dialog-alert").dialog("close");
                },
                Cancel: function() {
                    if ($("#alertsType").text() == 'comment') {
                        alertDialog({"type": 'comment', "page": pageData.session.currentPage});
                    }					
                    $("#dialog-alert").dialog("close");
                }
            },
        dialogClass: 'my-dialog'
    });
    
    function alertDialog(Obj) {
        if (Obj.type == 'comment') {
            $.ajax({
                type: "POST",
                url: "comment/submit",
                dataType: "json",
                cache: false,
                data: {"page": Obj.page, "content": $("#submitQuestionArea").val()},
                success: function(response) {
                    alert("Comments submitted!");
                    $("#submitQuestionArea").val('');
                }
            });		
        }
    }
    
    function notificationDesktop(Obj) {
        if ($("#interactivityArea" + Obj.name).is(':visible')) {
        
        } else {
            $("#interactivityNotification" + Obj.name).show();
            if ($("#interactivityNotification" + Obj.name).text()) {
                $("#interactivityNotification" + Obj.name).text(parseInt($("#interactivityNotification" + Obj.name).text()) + 1);
            } else {
                $("#interactivityNotification" + Obj.name).append("1");
            }
        }
    }
    window.notificationDesktop = notificationDesktop;
});