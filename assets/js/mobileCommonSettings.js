$(function() {
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined" && typeof pageData.session.slides != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){
                pageData.session.currentPage = slideIndex + 1;
                pageData.session.currentFileName = pageData.session.slides[slideIndex].name;
                pageData.session.currentFileId = pageData.session.slides[slideIndex].fileId;
                pageData.session.currentFilePage = pageData.session.slides[slideIndex].page + 1;
            });
            clearInterval(loop);
        }
    }, 30);
    
    socket.on('connect', function () { 
        
    });    
    socket.on('disconnect', function () { 
        
    });     
    
    //-------------------------------------------
    // general settings below
    //-------------------------------------------
    
    $("#controlTools a").swipeleft(function(event){
        if ($("#openCanvas").position().left + $("#controlTools .ui-controlgroup-controls").width() > window.innerWidth) {
            $('#controlTools a').animate({left: $("#openCanvas").position().left - (100)}, 50, null);
        } else {
            return false;
        }
    });

    $("#controlTools a").swiperight(function(){
        if ($("#openCanvas").position().left != 0) {
            $('#controlTools a').animate({left: $("#openCanvas").position().left + (100)}, 50, null);
        } else {
            return false;
        }
    });   
    
    socket.on('connect', function () { 
        if ($("#connectionAlert").is(':Visible')){
            $("#connectionAlert").popup('close');
        } else {
        
        }
    });    
    
    socket.on('disconnect', function () { 
        $("#connectionAlert").popup('open');
    });         

    //-------------------------------------------
    // annotation settings below
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

    $("#openCanvas").click(function () {
        initialAnnotation(pageData.session.currentPage);
    });    
	
	function initialAnnotation(page) {
        $("#colors_demo").css({
            position: "absolute",
            width: $("#slider1_container").width(),
            left: (window.innerWidth - $("#slider1_container").width())/2,
            top: $("#slider1_container").position().top,
            zIndex: 9999
        });
        $("#colors_sketch").css({
            position: "absolute",
            width: $("#slider1_container").width(),
            left: "0px",
            zIndex: 9998
        });
        $("#colors_sketch2").css({
            position: "absolute",
            width: $("#colors_sketch").width(),
            left: "0px",
            zIndex: 9999
        });	        
      
        canvasHeight = $("#slider1_container").height() - $(".tools").height();
        canvasWidth = $("#slider1_container").width();	
        $("#colors_sketch").attr("height", canvasHeight);
        $("#colors_sketch").attr("Width", canvasWidth);
        $("#colors_sketch2").attr("height", canvasHeight);
        $("#colors_sketch2").attr("Width", $("#colors_sketch").width());
        $("#canvasDownload").attr("data-download1", pageData.session.currentPage);

        canvasImgParam.name = pageData.page.image[pageData.session.currentPage - 1].split("/")[3];
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
});