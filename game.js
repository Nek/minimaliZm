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


var STEP = 75;

var HEIGHT = 6;

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

var tx = 0;
var ty = 0;



var boxes = sequence(6*2).map(function(v){
    var box = new PIXI.Sprite(PIXI.Texture.fromImage("line.png"));
    box.anchor.x = 0.5;
    box.anchor.y = 0.5;
    box.alpha = v % 2 ? 1 : .5;
    box.position.x = STEP*4;
    box.position.y = v * STEP - STEP*HEIGHT;
    box.scale.x = box.scale.y = 1;
    level.addChild(box);
    return box;
})

var beatmeter = new PIXI.Sprite(PIXI.Texture.fromImage("greenline.png"));
beatmeter.anchor.x = 0.5;
beatmeter.anchor.y = 0.5;
beatmeter.position.x = STEP*4;
stage.addChild(beatmeter);

var scope = new PIXI.Sprite(PIXI.Texture.fromImage("scope.png"));
scope.anchor.x = .5;
scope.anchor.y = .5;
stage.addChild(scope);
scope.position.x = STEP*4;
scope.position.y = STEP*HEIGHT/2;
scope.blendMode = PIXI.blendModes.SCREEN;

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

var changes = [];
var lbeat = 0;


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

function timeAt(timevalue) {
    var l = timbre.timevalue(timevalue);
    return Math.round(interv.currentTime / l)*l;
}


T("audio").load("drumkit.wav", function() {
    var BD  = this.slice(   0,  500).set({bang:false});
    var SD  = this.slice( 500, 1000).set({bang:false});
    var HH1 = this.slice(1000, 1500).set({bang:false, mul:0.2});
    var HH2 = this.slice(1500, 2000).set({bang:false, mul:0.2});
    var CYM = this.slice(2000).set({bang:false, mul:0.2});
    var scale = new sc.Scale([0,1,3,7,8], 12, "Pelog");

    var P2 = sc.series(16);


    var drums = {BD:BD, SD:SD, HH1:HH1, HH2:HH2, CYM:CYM};
    var lead = T("saw", {freq:T("param")});
    var vcf  = T("MoogFF", {freq:2400, gain:6, mul:0.1}, lead);
    var env  = T("perc", {r:150});
    var arp  = T("OscGen", {wave:"sin(15)", env:env, mul:0.5});

    // beats
    var beat = {
        "HH1":[1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
        "BD" :[1, 0, 0, 0, 1, 0, 0, 0],
        "HH2" : [0,1,0,0],
        "CYM": [0,0,0,0,1]
//        ,"SD": [0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0]
    };


    T("delay", {time:"BPM128 L4", fb:0.65, mix:0.35},
        T("pan", {pos:0.2}, vcf),
        T("pan", {pos:T("tri", {freq:"BPM"+BPM/2+" L1", mul:0.8}).kr()}, arp)
    ).play();

    var drum = T("lowshelf", {freq:110, gain:8, mul:0.6}, HH1, HH2, CYM, SD, BD).play();
    window.interv = interv = T("interval", {interval:"BPM"+BPM+" L16"}, function(count) {
        lbeat = interv.currentTime;
        var keys = Object.keys(beat);
        for (var i = 0; i < keys.length; i++) {
            if (sc.rotate(beat[keys[i]], count)[0] === 1) drums[keys[i]].bang();
        }
        var noteNum = scale.wrapAt(P2.wrapAt(count)) + 60;
        if (i % 2 === 0) {
            lead.freq.linTo(noteNum.midicps() * 2, "100ms");
        }
        arp.noteOn(noteNum + 24, 60);

        // PAUSE logic
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
        // PAUSE end
        //
        //if (interv.count % 4 === 0)
        beatmeter.position.y = Math.round((interv.count % HEIGHT)) * STEP;

    }).start();
 // LOGICS START
    function everySecond(t) {return fits(t, timeAt("BPM"+BPM+" L4"), 100);};
    function nearBeat(t,d) {
        return t < (lbeat + d) || t > (lbeat+ timbre.timevalue("BPM" + BPM + "L16") - d)
    }

    function nearSecond(t,d) {
        return t < (lbeat + d) || t > (lbeat+ timbre.timevalue("BPM" + BPM + "L16") - d)
    }



    var level1 = {
        count: 0,
        check: function(t) {
            if (nearBeat(t, 100) && interv.count % 4 !== 0 && interv.count % 2 === 0) {
                this.count ++;
                SD.bang();
            } else {
                this.count = 0;
            }
            if (this.count === 8) {
                changeBPM(5);
                this.count = 0;
            }
        }
    }
    function brain(t) {
        level1.check(t);
    }
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
                brain(interv.currentTime);
                break;
            default:
                null;
        }
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
        var bps = beatsPassed();
        var move = bps*STEP/30000;
        level.position.y = move%(STEP*HEIGHT) - STEP/2;
        console.log(move%(STEP*HEIGHT));
        renderer.render(stage);
    }

    requestAnimFrame( animate );

});}

