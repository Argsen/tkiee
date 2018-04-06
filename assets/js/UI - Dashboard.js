$(function () {
    //-------------------------------------------
    // Jssor Slider settings below
    //-------------------------------------------
    
    var options = {
        $FillMode: 2,                                       //[Optional] The way to fill image in slide, 0 stretch, 1 contain (keep aspect ratio and put all inside slide), 2 cover (keep aspect ratio and cover whole slide), 4 actuall size, default value is 0
        $ArrowKeyNavigation: false,   			            //[Optional] Allows keyboard (arrow key) navigation or not, default value is false
        $LazyLoading:	 0,
        $Loop: 0,
        
        $ThumbnailNavigatorOptions: {                       //[Optional] Options to specify and enable thumbnail navigator or not
            $Class: $JssorThumbnailNavigator$,              //[Required] Class to create thumbnail navigator instance
            $ChanceToShow: 2,                               //[Required] 0 Never, 1 Mouse Over, 2 Always

            $ActionMode: 1,                                 //[Optional] 0 None, 1 act by click, 2 act by mouse hover, 3 both, default value is 1
            $Lanes: 1,                                      //[Optional] Specify lanes to arrange thumbnails, default value is 1
            $DisplayPieces: 6,                             //[Optional] Number of pieces to display, default value is 1
            $ParkingPosition: 137,                          //[Optional] The offset position to park thumbnail
            $Orientation: 2,                                //[Optional] Orientation to arrange thumbnails, 1 horizental, 2 vertical, default value is 1
            
            $ArrowNavigatorOptions: {
                $Class: $JssorArrowNavigator$,              //[Requried] Class to create arrow navigator instance
                $ChanceToShow: 2,                               //[Required] 0 Never, 1 Mouse Over, 2 Always
                $AutoCenter: 1,                                 //[Optional] Auto center arrows in parent container, 0 No, 1 Horizontal, 2 Vertical, 3 Both, default value is 0
                $Steps: 6                                       //[Optional] Steps to go for each navigation request, default value is 1
            }                
        },
        
        $ArrowNavigatorOptions: {
            $Class: $JssorArrowNavigator$,
            $ChanceToShow: 1,
            $AutoCenter: 2, 
        },        

        $BulletNavigatorOptions: {                                //[Optional] Options to specify and enable navigator or not
            $Class: $JssorBulletNavigator$,                       //[Required] Class to create navigator instance
            $ChanceToShow: 2,                               //[Required] 0 Never, 1 Mouse Over, 2 Always
        }
    };

    var getImgSize = function (imgSrc) {
        var newImg = new Image();

        newImg.onload = function() {
            scaleSlider(newImg.width, newImg.height);        
            
            var jssor_slider1 = new $JssorSlider$("slider1_container", options);
            window.jssor_slider1 = jssor_slider1;
        }
        
        newImg.src = imgSrc; // this must be done AFTER setting onload
    }

    function scaleSlider(width, height) {
        var imgWidth = width,
            imgHeight = height,
            windowHeight = window.innerHeight - $("#controlBar").height();

        var setWidthContainer = 0,
            setHeightContainer = 0,
            setWidthSlides  = 0,
            setHeightSlides = 0;
        
/*        if (window.innerWidth * (imgHeight / imgWidth) + 21 > windowHeight) {
            setWidthSlides = (windowHeight - 21) * (imgWidth / imgHeight);
            setHeightSlides = windowHeight - 21;                           
        } else {
            setWidthSlides = window.innerWidth - 100;  
            setHeightSlides = window.innerWidth * (imgHeight / imgWidth);                      
        }
        setWidthContainer = setWidthSlides + 100;
        setHeightContainer = setHeightSlides + 21;       */    


        if (imgWidth / imgHeight > (window.innerWidth - 110) / (windowHeight - 21)) {
            setWidthSlides = window.innerWidth - 110;
            setHeightSlides = (window.innerWidth - 110) * (imgHeight / imgWidth);
        } else if (imgWidth / imgHeight == (window.innerWidth - 110) / (windowHeight - 21)) {
            setWidthSlides = window.innerWidth - 110;
            setHeightSlides = (windowHeight - 21);
        } else {
            setWidthSlides = (windowHeight - 21) * (imgWidth / imgHeight);
            setHeightSlides = windowHeight - 21;
        }
        setWidthContainer = setWidthSlides + 110;
        setHeightContainer = setHeightSlides + 21; 
        
        $("#slider1_container").width(setWidthContainer);
        $("#slider1_container").height(setHeightContainer);
        $(".slides").width(setWidthSlides);
        $(".slides").height(setHeightSlides);
        $(".jssort02").height(setHeightSlides);
    }
    
    getImgSize(pageData.page.image[0]);
    
    var loop = setInterval(function () {
        if (typeof jssor_slider1 != "undefined" && typeof pageData.session.slides != "undefined") {
            jssor_slider1.$On($JssorSlider$.$EVT_PARK,function(slideIndex, fromIndex){
                $("#currentFilePage").text("File: " + pageData.session.slides[slideIndex].name + " : Slide No. " + (pageData.session.slides[slideIndex].page + 1));
            });
            socket.get('/socket/getcurrentpage', function(response) {
                if (jssor_slider1.$SlidesCount() == 1) {
                    jssor_slider1.$TriggerEvent($JssorSlider$.$EVT_PARK, 0, 0);
                } else {
                    jssor_slider1.$GoTo(response.page);
                }
            });   
            clearInterval(loop);
        }
    }, 30);
    
    socket.on('pageSynchronise', function(res) {
        jssor_slider1.$GoTo(res.page);
    });         

    //-------------------------------------------
    // controlBar settings below
    //------------------------------------------- 

    var addControl = function (res) {
        this.add = function (res) {
            $("#controlBar div").append("<button class=\"controlItem\" id=\"controlItem" + res.name + "\">" + res.text + "</button>");
            $("#controlItem" + res.name).button({text: true, label: res.text, icons:{primary: res.icon}});
        },
        this.addLabel = function (res) {
            $("#controlBar div").append("<label class=\"controlBarLabel\" id=\"currentFilePage\" >File:   : Slide No. </label>");
            $("#controlBar div").append("<label class=\"controlBarLabel\" id=\"keyPhaseonHeader\" style=\"color: red;\">" + pageData.session.sessionKey.toLowerCase() + " @ www.tkiee.com</label>"); 	 
        }
    }
    var addNewControl = new addControl();
    
    for (var i=0; i<pageData.user.preference.control.length; i++) {
        addNewControl.add(pageData.user.preference.control[i]);
    }
    addNewControl.addLabel();  
    
    //-------------------------------------------
    // interactivityBar settings below
    //------------------------------------------- 
    
    var addInteractivity = function (res) {
        this.add = function (res) {
            var interactivity = $("<div class=\"interactivityItem\" id=\"interactivityItem" + res.name + "\"></div>");
            var interactivityIcon = $("<img class=\"interactivityItemIcon\" src=\"" + res.icon + "\"></img>");
            var interactivityLabel = $("<span style=\"display: block;\">" + res.text + "</span>");
            var interactivityArea = $("<div class=\"ui-widget-content ui-resizable interactivityArea\" id=\"interactivityArea" + res.name + "\"></div>");
            var interactivityNotification = $("<div class=\"ui-widget-content interactivityNotification\" id=\"interactivityNotification" + res.name + "\"></div>");
            var interactivityToolbar = $("<div id=\"" + res.name + "Toolbar\" style=\"height: 25px;\" class=\"ui-widget-header ui-corner-all\"></div>");
            
            
            interactivityNotification.appendTo(interactivity);
            interactivityIcon.appendTo(interactivity);
            interactivityLabel.appendTo(interactivity);
            interactivity.appendTo($("#interactivityBar"));
            interactivityArea.appendTo($("#controlArea"));
            interactivityToolbar.appendTo(interactivityArea);
            interactivityArea.css('height', window.innerHeight - 28);         
            interactivity.disableSelection();         
            interactivity.click(function () {          
                if ($("#interactivityArea" + res.name).is(':visible')) {
                    $(".interactivityArea").hide();
                    $(".interactivityItem").css('background-color','#cccccc');
                } else {
                    $(".interactivityArea").hide();
                    $("#interactivityArea" + res.name).show();
                    $(".interactivityItem").css('background-color','#cccccc');
                    $("#interactivityItem" + res.name).css('background-color','#ffffff');
                }
                interactivityArea.css({
                    top: 25,
                    left: window.innerWidth - interactivityArea.width() - 60
                })
                interactivityArea.resizable({ handles: 'w'});
                interactivityNotification.hide();
                interactivityNotification.text('');
            });
        }
    }
    window.addInteractivity = addInteractivity;

    var addNewInteractivity = new addInteractivity();
    for (var i=0; i<pageData.user.preference.interactivity.length; i++) {
        addNewInteractivity.add(pageData.user.preference.interactivity[i]);
    }
    
    //-------------------------------------------
    // general settings below
    //-------------------------------------------
    
    socket.on('disconnect', function(){
		socket.post('/socket/join', function(response) {
			console.log(response);
		});		
	});
    
	socket.post('/socket/join', function(response) {
		pageData.session.currentParticipant = response.currentParticipant;
		pageData.session.maxParticipant = response.maxParticipant;
    });     
    
    $("#controlItemBacktoLogin").click(function () {
        window.location.href='login';
    });    

    $("#showHideControlItem")
        .button({text: false, label: 'Show Control',icons:{primary:"ui-icon-pin-w"}})
        .click(function () {
            if ($(".controlItem").is(':visible')) {
                $(".controlItem").hide();
                $("#controlItemScrollLeft").hide();
                $("#controlItemScrollRight").hide();
                $("#showHideControlItem").button("option", {label: "Show Control"});
                $(".controlBarLabel").css({
                    left: 0
                });
                $(".controlItem").css({
                    left: 0
                });                 
            } else {
                $("#controlItemScrollLeft").show();
                $("#controlItemScrollRight").show();            
                $(".controlItem").show();
                $("#showHideControlItem").button("option", {label: "Hide Control"});            
            }
        });
        
    var controlItemScrollLoop;
    var controlBarLabelLoop;
        
    $("#controlItemScrollLeft")
        .button({text: false, label: "Scroll Left", icons:{primary: "ui-icon-triangle-1-w"}})
        .on('mouseenter', function () {
            controlItemScrollLoop = setInterval(function () {
                if (($("#keyPhaseonHeader").position().left + $("#keyPhaseonHeader").width() + 100) > $("#controlItemScrollRight").position().left) {
                    $( ".controlItem" ).animate({ "left": "-=5px" }, 10);              
                }    
            }, 20);
            controlBarLabelLoop = setInterval(function () {
                if (($("#keyPhaseonHeader").position().left + $("#keyPhaseonHeader").width() + 100) > $("#controlItemScrollRight").position().left) {
                    $( ".controlBarLabel" ).animate({ "left": "-=5px" }, 10);
                }
            }, 20);
        })
        .on('mouseleave', function () {
            clearInterval(controlItemScrollLoop);
            clearInterval(controlBarLabelLoop);
        });    
    
    $("#controlItemScrollLeft").css({
        position: "absolute",
        left: 28,
        top: 0
    });     
    
    $("#controlItemScrollRight")
        .button({text: false, label: "Scroll Right", icons:{primary: "ui-icon-triangle-1-e"}})
        .on('mouseenter', function () {
            controlItemScrollLoop = setInterval(function () {
                if ($("#controlItemBacktoLogin").position().left < 0) {
                    $( ".controlItem" ).animate({ "left": "+=5px" }, 10);
                }
            }, 20);
            controlBarLabelLoop = setInterval(function () {
                if ($("#controlItemBacktoLogin").position().left < 0) {
                    $( ".controlBarLabel" ).animate({ "left": "+=5px" }, 10);
                }
            }, 20);
        })
        .on('mouseleave', function () {
            clearInterval(controlItemScrollLoop);
            clearInterval(controlBarLabelLoop);
        }); 
    $("#controlItemScrollRight").css({
        position: "absolute",
        right: 28,
        top: 0
    });    
            
    $("#showHideInteractivityItem")
        .button({text: false, label: 'Show Interactivity',icons:{primary:"ui-icon-pin-s"}})
        .click(function () {
            if ($(".interactivityItem").is(':visible')) {
                $(".interactivityItem").hide();
                $("#showHideInteractivityItem").button("option", {label: "Show Interactivity"});
            } else {
                $(".interactivityItem").show();
                $("#showHideInteractivityItem").button("option", {label: "Hide Interactivity"});
                for (var i=0; i<pageData.user.preference.interactivity.length; i++) {
                    $("#interactivityNotification" + pageData.user.preference.interactivity[i].name).css({
                        top: $("#interactivityItem" + pageData.user.preference.interactivity[i].name).position().top,
                        right: 0
                    });
                }
            }
        });
        
    $("#showHideInteractivityItem").css({
        position: "absolute",
        right: 0
    });
    
    var dialogExtendOptions = {
        "closable" : true,
        "maximizable" : true,
        "minimizable" : true,
        "collapsable" : true,
        "dblclick" : false,
        "titlebar" : false
    }
    window.dialogExtendOptions = dialogExtendOptions;
    
/*    function toggleFullScreen() {
      if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
       (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {  
          document.documentElement.requestFullScreen();  
        } else if (document.documentElement.mozRequestFullScreen) {  
          document.documentElement.mozRequestFullScreen();  
        } else if (document.documentElement.webkitRequestFullScreen) {  
          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
        }  
      } else {  
        if (document.cancelFullScreen) {  
          document.cancelFullScreen();  
        } else if (document.mozCancelFullScreen) {  
          document.mozCancelFullScreen();  
        } else if (document.webkitCancelFullScreen) {  
          document.webkitCancelFullScreen();  
        }  
      }  
    }       */
    
    socket.on('connect', function () { 
        if ($("#connectionAlert").is(':Visible')){
            $("#connectionAlert").hide();
        } else {
        
        }
    });    
    
    socket.on('disconnect', function () { 
        $("#connectionAlert").show();
    });           
}); 