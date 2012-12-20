/**
 * Jsmovieclip,
 * create, animate, & control sprite sheet animation as AS3 movieclip
 * work on all browser (from IE5.5), all smartphones & tablets devices
 * @author Jeremy Petrequin
 * @website http://jsmovieclip.jeremypetrequin.fr
 * 
 * a lot of things are currently not working
 * 
 * http://jsperf.com/jquery-backgroundposition-vs-native-backgroundposition
 */
   
(function() {
    
    "use strict";
    function JSMovieclip(elmts, params) {
        var t = this;
        t.elmts = toString.call(elmts) === "[object Array]"  ?  elmts : [elmts]; //isArray method, stolen from jQuery
        t.playing = false;
        t.framerate = params.framerate || 25;
        t.frames = [];
        t.loop = !!params.loop;
        t.elmtsLength = t.elmts.length;
        t.stopCallback = params.stopCallback || null;
        t.firstFrame = 1;
        t.lastFrame = 1;
        
        t._label = '';
        t._idx = 0;
        t._timer = null;
        t._tmpFrames = [];
        t._way = 1;
        t._framesNumber = params.frames_number || 0;
        
        t.updateFrames(params.frame, params.direction, params.width, params.height, params.frames_number);
    }
    
    
    //you can extend and override what you want
    JSMovieclip.prototype = {
        //"protected" method
        _render : function() {
            var i = this.elmtsLength, t = this;
            while(i--) this.elmts[i].style.backgroundPosition = this._tmpFrames[this._idx];
            if(t.playing) {
                if(t._idx >= t.lastFrame -1) {
                    if(!t.loop) {
                        t.stop();
                        return;
                    }
                    t._idx = t.firstFrame - 1;
                } else {
                    t._idx++;
                }
            }
        },
        _enterFrame : function() {
            var t = this;
            t._render.call(t);
            t.playing && (t._timer = setTimeout(function() {
                                        t._enterFrame.call(t);
                                    }, 1000/t.framerate));
        },
        _calculateFrames : function() {
            this._tmpFrames = [];
            if(this._way == 1) {
                this._tmpFrames = this.frames;
            } else { 
                var i = this.frames.length;
                while(i--) {
                    this._tmpFrames.push(this.frames[i]);
                }
            }
            this._framesNumber = this.frames.length;
            this.clearLoopBetween();
        },
        /**
         * concat each frame as a string, to better performance
         */
        _cacheFrames : function() {
            var frames = this.frames,
            i = frames.length;
            this.frames = [];
            while(i--) this.frames[i] = '-'+frames[i].x+' -'+frames[i].y;
        },
        //public method
        
        /**
         * @param frames array  (optional)
         * @param direction string (h for horyzontal of v for vertical) (optional)
         * @param width float (in case of a horizontal sprite) (optional)
         * @param height float height of a frame (in case of a vertical sprite)(optional)
         * @param nbframe float number of frames (optional)
         */
        updateFrames : function(frames, direction, width, height, nbframe) {
            if(frames) {
                //gerer les unités
                this.frames = frames;
                this._cacheFrames();
                this._calculateFrames();
                return;
            }
            //some error reporting
            if(!frames && !direction) {throw "JSMovieclip need at least frames array or a direction ";return;}
            if(direction == 'v' && !height) {throw "If you want to use a vertical sprite, JSMoviclip need a height";return;}
            if(direction == 'h' && !width) {throw "If you want to use a horizontal sprite, JSMoviclip need a width";return;}
            if(!nbframe) {throw "If you want to use a horizontal of vertical sprite, JSMoviclip need a number of frame";return;}
            
            var i = 0;
            for(;i<nbframe;i++) {
                this.frames.push({
                    x : (direction == 'h' ? i * width : 0) + 'px',
                    y : (direction == 'v' ? i * height : 0) + 'px'
                });
            }
            i=null;
            this._cacheFrames();
            this._calculateFrames();
            return this;
        },
        /**
         * @return way (int) of playing : 1 normal way, -1 inverted way
         */
        getWay : function() {
            return this._way;
        },
        /**
         * change the way of playing
         * @param way int : 1 normal way, -1 inverted way
         * @return current JSMovieclip object
         */
        changeWay : function(way) {
          if(way == this._way) return this;
          this._way = way;
          this._calculateFrames();
          return this;
        },
        clearLoopBetween : function() {
            this.firstFrame = 1;
            this.lastFrame = this._framesNumber;
            return this;
        },
        loopBetween : function(firstFrame, lastFrame) {
            if(firstFrame >= lastFrame) {firstFrame = lastFrame;throw 'Firstframe and lastframe are equals or inverted';}
            this.firstFrame = Math.max(firstFrame, 1);
            this.lastFrame = Math.min(lastFrame, this._framesNumber);
            (this._idx < this.firstFrame - 1 || this._idx > this.lastFrame -1) && (this._idx = this.firstFrame -1);
            return this;
        },
        currentFrame : function() {
            return this._idx + 1;
        },
        prevFrame : function() {
            var current = this.currentFrame();
            return this.gotoAndStop( current <= this.firstFrame ? this.lastFrame : current -1);
        },
        nextFrame : function() {
            var current = this.currentFrame();
            return this.gotoAndStop(current >= this.lastFrame ? 1 : current +1);
        },
        toggle : function(loop) {
            return !this.playing ? this.play(loop) : this.stop();
        },
        play : function(loop) {
            if(this.playing) return;
            this._idx === this.lastFrame-1 && (this._idx = this.firstFrame-1)
            this.playing = true;
            this.loop = !!loop;
            this._enterFrame();
            return this;
        },
        stop : function() {
            this.playing = false;
            if(this._timer) {clearTimeout(this._timer);this._timer = null;}
            this.stopCallback && this.stopCallback();
            return this;
        },
        gotoAndPlay : function(frame, loop) {
            this._idx = Math.min(Math.max(frame, this.firstFrame), this.lastFrame) -1;
            return this.play(loop);
        },
        gotoAndStop : function(frame) {
            this._idx = Math.min(Math.max(frame, this.firstFrame), this.lastFrame) -1;
            this.loop = false;
            this.playing = false;
            this._enterFrame();
            this.stopCallback && this.stopCallback();
            return this;
        }
    };

    
    window.JSMovieclip = JSMovieclip;
    
    /**************************************
     *             plugin instanciation                 *
     **************************************/ 
    /*$.fn.movieclip = function(options) {
        if ( this.length ) {
          var mc = new MovieClip(this, options);
          $.data(this, 'Movieclip', mc);  
          return mc;
        }
    };*/
    
})();


