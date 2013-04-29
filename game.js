function start(){
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


function sequence(l) {
    var arr = new Array(l);
    var i;
    for (i = 0; i < arr.length; i++) arr[i] = i;
    return arr;
}

/*
 *
 *
 *
 *
 *
 */


var STEP = 50;

var HEIGHT = 8;

var BPM = 80;


/*
 *
*
*   Graphics system
*
*
* */


// create an new instance of a pixi stage
var stage = new PIXI.Stage(0x000000);
var level = new PIXI.DisplayObjectContainer();
level.position.x = 0;
level.position.y = 0;
stage.addChild(level);
// create a renderer instance.
var renderer = PIXI.autoDetectRenderer(STEP*8, STEP*HEIGHT);

// add the renderer view element to the DOM
document.body.appendChild(renderer.view);

var boxes = sequence(16*2).map(function(v){
    var box = new PIXI.Sprite(PIXI.Texture.fromImage("line.png"));
    box.anchor.x = 0.5;
    box.anchor.y = 0.5;
    box.alpha = v % 2 ? 1 : .5;
    box.position.x = STEP*4;
    box.position.y = - v * STEP;
    box.scale.x = box.scale.y = 1;
    level.addChild(box);
    return box;
})

var beatmeter = new PIXI.Sprite(PIXI.Texture.fromImage("greenline.png"));
beatmeter.anchor.x = 0.5;
beatmeter.anchor.y = 0.5;
beatmeter.position.x = STEP*4;
//stage.addChild(beatmeter);

var scope = new PIXI.Sprite(PIXI.Texture.fromImage("scope.png"));
scope.anchor.x = .5;
scope.anchor.y = .5;
scope.position.x = STEP*4;
//scope.position.y = 100;

stage.addChild(scope);
//scope.blendMode = PIXI.blendModes.SCREEN;

var bpmText = new PIXI.Text("BPM"+BPM, "22px Arial", "red");
bpmText.anchor.x = 0;
bpmText.anchor.y = 1;
bpmText.position.y = STEP*HEIGHT;
stage.addChild(bpmText);

var scoreText = new PIXI.Text("0", "22px Arial", "red");
scoreText.anchor.x = 1;
scoreText.anchor.y = 1;
scoreText.position.x = STEP*8;
scoreText.position.y = STEP*HEIGHT;
//stage.addChild(scoreText);
//

var message = new PIXI.Text("", "22px Arial", "white");
message.anchor.x = .5;
message.anchor.y = .5;
message.position.x = STEP*4;
message.position.y = STEP*HEIGHT/3;
stage.addChild(message);

var changes = [];
var lbeat = 0;
var tween;

function showMessage(txt) {
  //TWEEN.remove(tween);
    message.setText(txt);
    message.alpha = 0;

    tween = new TWEEN.Tween(message)
    .to({alpha: 1}, 2000)
    .easing( TWEEN.Easing.Elastic.Out );
    tween.start();
}

function fadeMessage() {
    console.log("!");
  //TWEEN.remove(tween);
    tween = new TWEEN.Tween(message)
    .to({alpha: 0}, 2000)
    .easing( TWEEN.Easing.Elastic.Out )
    .start();

}

/*
 *
*
*
*   Sound system
*
*
* */


sc.use("prototype");

var interv;


function fits(v, base, span) {
    return v > base - span && v < base + span;
}

T("audio").load("drumkit.wav", function() {
    var BD  = this.slice(   0,  500).set({bang:false});
    var SD  = this.slice( 500, 1000).set({bang:false});
    var HH1 = this.slice(1000, 1500).set({bang:false, mul:0.2});
    var HH2 = this.slice(1500, 2000).set({bang:false, mul:0.2});
    var CYM = this.slice(2000).set({bang:false, mul:0.2});
    var scale = new sc.Scale([0,1,3,7,8], 12, "Pelog");

    var P2 = sc.series(16);

    var synth = T("OscGen", {wave:"saw", mul:0.25}).play();


    var drums = {BD:BD, SD:SD, HH1:HH1, HH2:HH2, CYM:CYM};
    var lead = T("saw", {freq:T("param")});
    var vcf  = T("MoogFF", {freq:2400, gain:6, mul:0.1}, lead);
    var env  = T("perc", {r:150});
    var arp  = T("OscGen", {wave:"sin(15)", env:env, mul:0.5});

    // beats
    var beat = {
        //"HH1":[1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
        //"BD" :[1, 0, 0, 0, 1, 0, 0, 0],
        //"HH2" : [0,1,0,0],
        //"CYM": [0,0,0,0,1]
//        ,"SD": [0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0]
    };


    var delay = T("delay", {time:"BPM"+BPM+" L4", fb:0.65, mix:0.35},
        T("pan", {pos:0.2}, vcf),
         T("pan", {pos:0.6}, synth),
        T("pan", {pos:T("tri", {freq:"BPM"+BPM/2+" L1", mul:0.8}).kr()}, arp)
    ).play();

    var drum = T("lowshelf", {freq:110, gain:8, mul:0.6}, HH1, HH2, SD, BD, CYM).play();
    window.interv = interv = T("interval", {interval:"BPM"+BPM+" L16"}, function(count) {
        lbeat = interv.currentTime;
        var keys = Object.keys(beat);
        for (var i = 0; i < keys.length; i++) {
            if (sc.rotate(beat[keys[i]], count)[0] === 1) drums[keys[i]].bang();
        }
        var noteNum = scale.wrapAt(P2.wrapAt(count)) + 60;
        if ( count % 2 === 0) {
            lead.freq.linTo(noteNum.midicps() * 2, "100ms");
        }
        arp.noteOn(noteNum + 24, 60);

        // PAUSE logic
        /*
        window.onblur = function() {
            lead.set("mul", 0);
            drum.set("mul", 0);
            arp.set("mul", 0);
        }

        window.onfocus = function() {
            lead.set("mul", 1);
            drum.set("mul", 0.6);
            arp.set("mul", 0.5);
        }
        */
        // PAUSE end
        //
        //if (interv.count % 4 === 0)
        //beatmeter.position.y = Math.round((interv.count % HEIGHT)) * STEP;

    }).start();
 // LOGICS START
    function everySecond(t) {return fits(t, timeAt("BPM"+BPM+" L4"), 100);};
    function nearBeat(t,d) {
        return t < (lbeat + d) || t > (lbeat+ timbre.timevalue("BPM" + BPM + "L16") - d)
    }

    function nearSecond(t,d) {
        return t < (lbeat + d) || t > (lbeat+ timbre.timevalue("BPM" + BPM + "L16") - d)
    }

    var start = {
        start: function() {

        }
    }

    var currLevel;

    var level0 = {
        //message
        //fade out whileholding
        //
        //
        scopeTween: null,
        count: 0,
        keydown: function(t) {
            fadeMessage();
            var s = STEP*HEIGHT + scope.height;
            var t = STEP*HEIGHT/2;
            var c = scope.position.y;
            var fulld = s - t;
            var currd = c - t;
            var time = 5000*currd/fulld;
            this.scopeTween = new TWEEN.Tween(scope.position).to({y:STEP*HEIGHT/2}, time).onComplete(this.end).start();
        },
        keyup: function(t) {
            showMessage("hold Z");
            this.scopeTween.stop();
            var s = STEP*HEIGHT + scope.height;
            var t = STEP*HEIGHT/2;
            var c = scope.position.y;
            var fulld = s - t;
            var currd = s - c;
            var time = 1000*currd/fulld;

            this.scopeTween = new TWEEN.Tween(scope.position).to({y:STEP*HEIGHT+scope.height}, time).start();
            scope.position.y = STEP*HEIGHT + scope.height;
        },
        update: function(t) {

        },
        start: function(t) {
            //lead.set("mul", 0);
            //drum.set("mul", 0);
            arp.set("mul", 0);
            showMessage("hold Z");
            level.alpha = 0;
            scope.position.y = STEP*HEIGHT + scope.height;
        },
        end: function() {
            //drum.set("mul", .6);
            currLevel = level1;
            level1.start();
        }
    }

    var level1 = {
        count: 0,
        start: function() {
            showMessage("bright lines");
            beat.HH1 = [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0];
            var ltw = new TWEEN.Tween(level).to({alpha:1}, 5000).start();
        },
        end: function() {
        },
        keyup: function() {
        },
        keydown: function(t) {
            if (this.count === 1) fadeMessage();
            if (nearBeat(t, 100) && interv.count % 4 !== 0 && interv.count % 2 === 0) {
                this.count ++;
                SD.bang();
            } else {
                this.count = 0;
                showMessage("bright lines");
            }
            if (this.count === 8) {
                this.count = 0;
                currLevel = level2;
                level2.start();
            }
        },
        update: function() {
        }
    }


    var level2 = {
        count: 0,
        start: function() {
            showMessage("other lines");
            //beat.HH1 = [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0];
            beat.HH2 = [0,1,0,0];
        //"CYM": [0,0,0,0,1]
            beat.SD = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0];

            //var ltw = new TWEEN.Tween(level).to({alpha:1}, 5000).start();
        },
        end: function() {
        },
        keyup: function() {
        },
        keydown: function(t) {
            if (this.count === 1) fadeMessage();
            if (nearBeat(t, 100) && interv.count % 4 === 0) {
                this.count ++;
                BD.bang();
            } else {
                this.count = 0;
                showMessage("other lines");
            }
            if (this.count === 8) {
                //level2.start();
                currLevel = level3;
                this.count = 0;
                level3.start();
            }
        },
        update: function() {
        }
    }

    var note;

    var level3 = {
        count: 0,
        start: function() {
            //showMessage("other lines");
            //beat.HH1 = [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0];
            //beat.HH2 = [0,1,0,0];
            //beat.CYM = [0,0,0,0,1];
            beat.BD = [1, 0, 0, 0, 1, 0, 0, 0];
             //lead.set("mul", 1);
            arp.set("mul", .5);
            //lead.set("mul", 1);

            //beat.SD = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0];

            //var ltw = new TWEEN.Tween(level).to({alpha:1}, 5000).start();
        },
        end: function() {
        },
        keyup: function() {
            synth.noteOff(note,100);
        },
        keydown: function(t) {
            //if (this.count === 1) fadeMessage();
            //
            var noteNum = scale.wrapAt(P2.wrapAt(this.count)) + 60;
        //if ( count % 2 === 0) {
                   //}
        //arp.noteOn(noteNum + 24, 60);

            if(nearBeat(t, 100)) {
                if (interv.count % 4 !== 0 && interv.count % 2 === 0) {
                    this.count += 1;
                      //lead.freq.linTo(noteNum.midicps() * 2, "100ms");
                    synth.noteOnWithFreq(noteNum.midicps() * 2, 100);

                } else if (interv.count % 4 === 0 ) {
                    this.count -= 1;
                    //  lead.freq.linTo(noteNum.midicps() * 2, "100ms");
                      note = noteNum;
                        synth.noteOnWithFreq(noteNum.midicps() * 2, 100);
                }
                           }
            else {
                this.count = 0;
                //showMessage("other lines");
            }
            if (this.count === 4) {
                changeBPM(5);
                //level2.start();
                //currentLevel = level2;
                this.count = 0;
            }
            if (this.count === -4) {
                changeBPM(-5);
                //level2.start();
                //currentLevel = level2;
                this.count = 0;
            }

        },
        update: function() {
        }
    }


    currLevel = level0;

    function brain(e,t) {
        currLevel[e](t);
    }

    currLevel.start();

    // LOGICS END


    T("keyboard").on("keydown", function(e) {
        switch (e.which) {
            case 187:
                changeBPM(20);
                break;
            case 189:
                changeBPM(-20);
                break;
            case 90:
                brain("keydown", interv.currentTime);
                break;
            default:
                null;
        }
    }).on("keyup",function(e){
        if (e.which === 90) brain("keyup", interv.currentTime);
    }).start();

     function changeBPM(v) {
        changes.push( {t:interv.currentTime, b:BPM} );
        BPM = BPM + v;
        interv.interval = "BPM"+BPM+" L16";
        bpmText.setText("BPM"+BPM);
    }

    function foldPos(res, c, i, a)
    {
        return {t:c.t, b: c.b, s: res.s + (res.t - c.t)*res.b + (i === 0 ? c.b : 0) };
    }

    function beatsPassed() {
        if (changes.length > 0) return changes.reduceRight(foldPos, {t: interv.currentTime, b: BPM, s: 0}).s;
        return interv.currentTime * BPM;
    }

    function animate() {
        requestAnimFrame(animate);
        TWEEN.update();
        brain("update", interv.currentTime);
        var bps = beatsPassed();
        var move = bps*STEP/30000;
        level.position.y =( (interv.count % 16 + (interv.currentTime - lbeat)/timbre.timevalue("BPM"+BPM+" L16"))*STEP/2 + HEIGHT * STEP);
        //console.log(move%(STEP*HEIGHT));
        renderer.render(stage);
    }

    requestAnimFrame( animate );

});}

