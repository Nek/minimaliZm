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

//sc.use("prototype");

function sequence(l) {
    var arr = new Array(l);
    var i;
    for (i = 0; i < arr.length; i++) arr[i] = i;
    return arr;
}

var STEP = 50;


// create an new instance of a pixi stage
var stage = new PIXI.Stage(0x000000);
var level = new PIXI.DisplayObjectContainer();
level.position.x = 0;
level.position.y = 0;
stage.addChild(level);
// create a renderer instance.
var renderer = PIXI.autoDetectRenderer(400, 300);

// add the renderer view element to the DOM
document.body.appendChild(renderer.view);

var tx = 0;
var ty = 0;


var texture = PIXI.Texture.fromImage("box.png");

var boxes = sequence(15000).map(function(v){
    var box = new PIXI.Sprite(PIXI.Texture.fromImage("box.png"));
    box.anchor.x = 0.5;
    box.anchor.y = 0.5;
    box.position.x = 200;
    box.position.y = v * STEP - 1000;
    box.scale.x = box.scale.y = .5;
    level.addChild(box);
    return box;
})

var scope = new PIXI.Sprite(PIXI.Texture.fromImage("scope.png"));
scope.anchor.x = .5;
scope.anchor.y = .5;
scope.position.x = 200;
scope.position.y = 200;

stage.addChild(scope);

var BPM = 80;

var bpmText = new PIXI.Text("BPM: "+BPM, "22px Arial", "red");
bpmText.anchor.x = 0;
bpmText.anchor.y = 1;
bpmText.position.y = 300;
stage.addChild(bpmText);

var scoreText = new PIXI.Text("0", "22px Arial", "red");
scoreText.anchor.x = 1;
scoreText.anchor.y = 1;
scoreText.position.x = 400;
scoreText.position.y = 300;
stage.addChild(scoreText);

var changes = [];
var lbeat = 0;

var beat = [1, 1, 1, 0, 1, 1, 1, 0];

T("audio").load("drumkit.wav", function() {
    var HH1 = this.slice(1000, 1500).set({bang:false, mul:0.2});
    var BD  = this.slice(   0,  500).set({bang:false});
    var drum = T("lowshelf", {freq:110, gain:8, mul:0.6}, HH1, BD).play();
    var interv = T("interval", {interval:"BPM"+BPM+" L16"}, function(count) {
        lbeat = interv.currentTime;
        scope.scale.x = scope.scale.y = 1.2;
        if (sc.rotate(beat, count)[0] === 0) {

           // scope.scale.x = scope.scale.y = 1 + .2;
        } else HH1.bang();
    }).start();

    //var keydict = T("ndict.key");
    //
    //187 +
    //189 -
    //

    function changeBPM(v) {
        changes.push( {t:interv.currentTime, b:BPM} );
        BPM = BPM + v;
        interv.interval = "BPM"+BPM+" L16";
        console.log("BPM: "+BPM);
        bpmText.setText("BPM"+BPM);
    }

    T("keyboard").on("keydown", function(e) {
        switch (e.which) {
            case 187:
                changeBPM(20);
                break;
            case 189:
                changeBPM(-20);
                break;
            case 90:
                //var nbeat = lbeat + 30000/(BPM*16)
                //if (interv.currentTime < lbeat + 70) {
                    BD.bang();
                //}
                break;
            default:
                null;
        }
    }).start();

    function foldPos(res, c, i, a)
    {
        console.log("r",res,"c",c,"i",i);
        console.log((res.t));
        console.log((c.t));
        return {t:c.t, b: c.b, s: res.s + (res.t - c.t)*res.b + (i === 0 ? c.b : 0) };
    }

    function animate() {
        var move = 0;
        if (changes.length > 0) {
            //console.log(changes);
            var s = changes.reduceRight(foldPos, {t: interv.currentTime, b: BPM, s: 0}).s;
            console.log(s);
            move = s*STEP/30000;
        } else move = interv.currentTime * (BPM*STEP/30000);
        level.position.y = move;
        requestAnimFrame(animate);
        renderer.render(stage);
    }

    requestAnimFrame( animate );

});}

