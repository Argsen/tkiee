var __slice = Array.prototype.slice;
(function($) {
  var Sketch;
  var imgParam;
  var imgBody;
  
  $.fn.sketch = function() {
    var args, key, sketch;
    key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (this.length > 1) {
      $.error('Sketch.js can only be called on one element at a time.');
    }
    sketch = this.data('sketch');
    if (typeof key === 'string' && sketch) {
      if (sketch[key]) {
        if (typeof sketch[key] === 'function') {
          return sketch[key].apply(sketch, args);
        } else if (args.length === 0) {
          return sketch[key];
        } else if (args.length === 1) {
          return sketch[key] = args[0];
        }
      } else {
        return $.error('Sketch.js did not recognize the given command.');
      }
    } else if (sketch) {
      return sketch;
    } else {
      this.data('sketch', new Sketch(this.get(0), key));
      return this;
    }
  };
  Sketch = (function() {
	function Sketch(el, opts) {
      this.el = el;
      this.canvas = $(el);
      this.context = el.getContext('2d');
	  
	  imgParam = opts;
	  imgBody = el;
	  imgBody.canvas = $(el);
	  imgBody.context = el.getContext('2d');
	  
      this.options = $.extend({
        toolLinks: true,
        defaultTool: 'marker',
        defaultColor: '#000000',
        defaultSize: 3
      }, opts);
      this.painting = false;
      this.color = this.options.defaultColor;
      this.size = this.options.defaultSize;
      this.tool = this.options.defaultTool;
      this.actions = [];
      this.action = [];
      this.canvas.bind('click mousedown mouseup mousemove mouseleave mouseout touchstart touchmove touchend touchcancel touchleave', this.onEvent);
      canvasObj = this;
      if (this.options.toolLinks) {
        $('body').delegate("a[href=\"#" + (this.canvas.attr('id')) + "\"]", 'click', function(e) {
          var $canvas, $this, key, sketch, _i, _len, _ref;
          $this = $(this);
          $canvas = $($this.attr('href'));
          sketch = $canvas.data('sketch');
          _ref = ['color', 'size', 'tool'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            key = _ref[_i];
            if ($this.attr("data-" + key)) {
              sketch.set(key, $(this).attr("data-" + key));
            }
          }
          if ($(this).attr('data-download')) {
            sketch.download($(this).attr('data-download'), $(this).attr('data-download1'));
          }
			if ($(this).attr('data-clear')) {
				sketch.stopPainting();
				sketch.clear();
			}
          return false;
        });
      }
    }
	
    Sketch.prototype.download = function(format, currentPage) {

	  var canvas2 = document.getElementById('colors_sketch2');
	  var context2 = canvas2.getContext('2d');	  
	  
	  var imgObj = new Image();
	  imgObj.src = "/image/getimage?name=" + imgParam.name;
	  imgObj.onload = function(){
		context2.drawImage(imgObj, imgParam.left, 0, imgParam.width, imgParam.height);
		context2.font="20px Calibri";
		context2.fillText("Page " + currentPage + " (Right Click/Hold to Save Image)",20,20);
		context2.drawImage(imgBody,0,(0 - imgParam.top));
	  }

	var mime;
      format || (format = "png");
      if (format === "jpg") {
        format = "jpeg";
      }
      mime = "image/" + format;

		setTimeout(function() {
			  return window.open(canvas2.toDataURL(mime));
		}, 2000);	  
    };
	Sketch.prototype.clear = function() {
		  this.actions = [];
          annotationAction[pageData.session.currentPage] = [];
		  return this.redraw();
	};	
    Sketch.prototype.set = function(key, value) {
	  this[key] = value;
      return this.canvas.trigger("sketch.change" + key, value);
    };
    Sketch.prototype.startPainting = function() {
      this.painting = true;
      this.action = {
        tool: this.tool,
        color: this.color,
        size: parseFloat(this.size),
        events: []
      };
      annotationAction[pageData.session.currentPage].push(this.action);
      return this.action;
    };
    Sketch.prototype.stopPainting = function() {
      if (this.action) {
        this.actions.push(this.action);
      //  annotationAction[pageData.session.currentPage].push(this.action);
      }
      this.painting = false;
      this.action = null;
      return this.redraw();  
    };
    Sketch.prototype.onEvent = function(e) {
	  if (e.originalEvent && e.originalEvent.targetTouches) {
        e.pageX = e.originalEvent.targetTouches[0].pageX;
        e.pageY = e.originalEvent.targetTouches[0].pageY;
      }
      $.sketch.tools[$(this).data('sketch').tool].onEvent.call($(this).data('sketch'), e);
      e.preventDefault();
      return false;
    };
    Sketch.prototype.redraw = function() {
	  var sketch;
      this.el.width = this.canvas.width();
      this.context = this.el.getContext('2d');
      sketch = this;
      $.each(annotationAction[pageData.session.currentPage], function() {
        if (this.tool) {
          return $.sketch.tools[this.tool].draw.call(sketch, this);
        }
      });
      if (this.painting && this.action) {
        return $.sketch.tools[this.action.tool].draw.call(sketch, this.action);
      }  
    };
    return Sketch;
  })();
  $.sketch = {
    tools: {}
  };
  $.sketch.tools.marker = {
    onEvent: function(e) {
      switch (e.type) {
        case 'mousedown':
        case 'touchstart':
		//	if (this.painting) {    //add
        //        this.stopPainting();  //add
		//	}           
			this.startPainting();
			break;
        case 'mouseup':
        case 'mouseout':
        case 'mouseleave':
        case 'touchend':
        case 'touchcancel':
        case 'touchleave':
            this.stopPainting();
      }
      if (this.painting) {
        this.action.events.push({
          x: (e.pageX - this.canvas.offset().left),
          y: e.pageY - this.canvas.offset().top,
          event: e.type
        });
        return this.redraw();
      }
    },
    draw: function(action) {
      var event, previous, _i, _len, _ref;
      this.context.lineJoin = "round";
      this.context.lineCap = "round";
      this.context.beginPath();
      this.context.moveTo(action.events[0].x * annotationWidthRate, action.events[0].y * annotationHeightRate);
      _ref = action.events;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this.context.lineTo(event.x * annotationWidthRate, event.y * annotationHeightRate);
        previous = event;
      }
      this.context.strokeStyle = action.color;
      this.context.lineWidth = action.size;
      return this.context.stroke();
    }
  };
  return $.sketch.tools.eraser = {
    onEvent: function(e) {
      return $.sketch.tools.marker.onEvent.call(this, e);
    },
    draw: function(action) {
      var oldcomposite;
      oldcomposite = this.context.globalCompositeOperation;
      this.context.globalCompositeOperation = "copy";
      action.color = "rgba(0,0,0,0)";
      $.sketch.tools.marker.draw.call(this, action);
      return this.context.globalCompositeOperation = oldcomposite;
    }
  };
})(jQuery);