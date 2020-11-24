let canvas;
let record_btn, draw_btn, clear_btn, save_btn;
let message = document.querySelector('#message');

let num_draw = 0;

let recognition, speechRecognitionList;

let descriptions = [];
let objects = [];
let models = [];
let times = [];
let model_counter;
let model_name;

// sketchRNN model
let model;
// Start by drawing
let previous_pen = 'down';
// Current location of drawing
let x, y;
// The current "stroke" of the drawing
let strokePath;

let category;
let sky_object, air_object, floor_object;

function preload() {
    category = loadJSON("scripts/category.json");
}

function setup() {
    canvas = createCanvas(windowWidth, 3 * windowHeight / 4);
    record_btn = select("#record-btn");
    draw_btn = select("#draw-btn");
    clear_btn = select("#clear-btn");
    save_btn = select("#save-btn");

    background(255);

    // console.log(category.AirObject);
    sky_object = category.SkyObject;
    air_object = category.AirObject;
    floor_object = category.FloorObject;
    all_object = sky_object.concat(air_object, floor_object);

    initialRec();
}

function initialRec() {
    // console.log("initialRec");
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

    var grammar = '#JSGF V1.0;'

    recognition = new SpeechRecognition();
    speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    recognition.grammars = speechRecognitionList;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = function (event) {
        let last = event.results.length - 1;
        let command = event.results[last][0].transcript;
        message.textContent = 'Voice Input: ' + command + '.';

        descriptions.push(command);

        objects = parseText(command);
        drawObjects(objects);
    };

    recognition.onspeechend = function () {
        recognition.stop();
    };

    recognition.onerror = function (event) {
        message.textContent = 'Error occurred in recognition: ' + event.error;
    }
}

function speech2text() {
    // console.log("speech2text");
    recognition.start();
}

// A new stroke path
function gotStroke(err, s) {
    strokePath = s;
}

function drawObjects(objects) {
    // drawDoolde(objects[0]);
    for (let i = 0; i < objects.length; i++) {
        let name = objects[i].name;
        let num = objects[i].num;
        let model = ml5.sketchRNN(name);
        models[name] = model;
        times[name] = num;
    }

    model_counter = 0;
    model_name = objects[0].name;
    drawDoolde(objects[0]);

    // console.log(models);
}

function drawDoolde(object) {
    // console.log("drawDoolde");
    noLoop();
    let name = object.name;
    let pos = object.pos;
    model = models[name];

    let right_offset, left_offset;
    if (!pos) {
        right_offset = 0;
        left_offset = 0;
    } else if (pos === "left") {
        right_offset = -width / 2;
        left_offset = 0;
    } else if (pos === "right") {
        right_offset = 0;
        left_offset = width / 2;
    }

    if (sky_object.indexOf(name) != -1) {
        console.log("sky_object");
        x = random(width / 10 + left_offset, 9 * width / 10 + right_offset);
        y = random(height / 10, height / 4);
        console.log(x, y);
    } else if (air_object.indexOf(name) != -1) {
        console.log("air_object");
        x = random(width / 10 + left_offset, 9 * width / 10 + right_offset);
        y = random(height / 4, height / 2);
        console.log(x, y);
    } else if (floor_object.indexOf(name) != -1) {
        console.log("floor_object");
        x = random(width / 10 + left_offset, 9 * width / 10 + right_offset);
        y = random(height / 2, 9 * height / 10);
        console.log(x, y);
    }

    // Generate the first stroke path
    model.reset();
    model.generate(gotStroke);
    loop();
}

function clearCanvas() {
    // console.log("clearCanvas");
    background(255);
    descriptions = [];
    current_text = null;
}

function saveDraw() {
    // console.log("saveDraw");
    let date = new Date();
    let year = date.getFullYear()
    let month = (date.getMonth() + 1).toString()
    let day = date.getDate().toString();
    let file_name = "my_draw" + "-" + year + "-" + month + "-" + day + "-" + num_draw;
    saveCanvas(canvas, file_name, "jpg");
    num_draw++;
}

function draw() {
    record_btn.mousePressed(speech2text);
    // draw_btn.mousePressed(drawDoolde);
    clear_btn.mousePressed(clearCanvas);
    save_btn.mousePressed(saveDraw);

    // If something new to draw
    if (strokePath) {
        // If the pen is down, draw a line
        if (previous_pen == 'down') {
            stroke(0);
            strokeWeight(3);
            line(x, y, x + strokePath.dx / 3, y + strokePath.dy / 3);
        }
        // Move the pen
        x += strokePath.dx / 3;
        y += strokePath.dy / 3;
        // The pen state actually refers to the next stroke
        previous_pen = strokePath.pen;

        // If the drawing is complete
        if (strokePath.pen !== 'end') {
            strokePath = null;
            model.generate(gotStroke);
        } else {
            strokePath = null;
            model.generate(gotStroke);
            times[model_name]--;
            if (times[model_name] === 0) {
                model_counter++;
                if (model_counter < objects.length) {
                    model_name = objects[model_counter].name;
                    previous_pen = 'down';
                    drawDoolde(objects[model_counter]);
                } else {
                    previous_pen = 'down';
                }
            } else {
                previous_pen = 'down';
                drawDoolde(objects[model_counter]);
            }
        }
    }
}