$(function() {
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){          
                pageData.session.currentPage = slideIndex + 1;
                pageData.session.currentFileName = pageData.session.slides[slideIndex].name;
                pageData.session.currentFileId = pageData.session.slides[slideIndex].fileId;
                pageData.session.currentFilePage = pageData.session.slides[slideIndex].page + 1;
                
                slideRating(slideIndex);
                if (slideTag[slideIndex] == 0) {
                    $("#slideTag").show();		
                } else {
                    $("#slideTag").hide();
                }                
            });
            clearInterval(loop);
        }
    }, 30);
    
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
    // annotation settings below
    //-------------------------------------------
    
	$("#openCanvas").click(function(){
        $("#tabs4").trigger("click");
        if ($("#colors_demo").is(':visible')) {
            $("#colors_demo").hide();
            initialAnnotation(pageData.session.currentPage);
        } else {
            $("#colors_demo").show();
            initialAnnotation(pageData.session.currentPage);
        }
    });
    
    socket.on('openAnnotation', function (res) {
        $("#tabs4").trigger("click");
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
 
    //-------------------------------------------
    // grouppower settings below
    //-------------------------------------------

    //-------------------------------------------
    // slidetag settings below
    //-------------------------------------------
    
    $("#slideRatingIcon").click(function () {
        $("#slideRatingDisplay").popup('open');
    });
    
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
						$("#slideRatingDisplayText1").text("Important");
					} else {
						$("#slideRatingDisplayText1").text("Very Important");
					}
					if (response.data.info.substring(0, 4) == "http") {
						$("#slideRatingDisplayText2").append("<a href=\"" + response.data.info + "\">" + response.data.info + "</a>");
					} else {
						$("#slideRatingDisplayText2").append("<span href=\"#\">" + response.data.info + "</span>");
					}					
				} else {
		
				}				
			}
		});			
	}
    
	var slideTag = Array();
	for (var i=0; i<pageData.session.totalPage; i++) {
		slideTag[i] = 0;
	}	
	
	$("#slideTag").click(function(){
		$.ajax({
			type: "POST",
			url: "filemodify/addtag",
			dataType: "json",
			cache: false,
			data: {"sessionId": pageData.session.sessionId, "fileId": pageData.page.id[pageData.session.currentPage - 1], "page": (pageData.session.currentPage -1)},
			success: function(response) {
				alert("Success");
				slideTag[pageData.session.currentPage - 1] = 1;
				$("#slideTag").hide();
			}
		});		
	});

    socket.on('slideRating', function (response) {
        slideRating(pageData.session.currentPage - 1);
    });    
    
    //-------------------------------------------
    // reference settings below
    //-------------------------------------------

    //-------------------------------------------
    // note settings below
    //-------------------------------------------

});