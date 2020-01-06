//include onoff to interact with the GPIO
const Gpio = require('onoff').Gpio;
//use GPIO pin 4, and specify that it is output
var redLED = new Gpio(17, 'out');
var greenLED = new Gpio(27,'out');
var blueLED = new Gpio(22,'out');

//run the blinkLED function every 250ms
//var blinkInterval = setInterval(blinkLED, 250); 

// loads module and registers app specific cleanup callback...
var cleanup = require('./cleanup').Cleanup(myCleanup);
//var cleanup = require('./cleanup').Cleanup(); // will call noOp
process.stdin.resume();
// defines app specific callback...
function myCleanup() {
  console.log('Switching off LEDs');
  lightLED('dark');
};

// list temperature devices
var base_dir = '/sys/bus/w1/devices/';
const fs = require('fs');
var cold = 20;
var hot = 22;
var sesnsorData = {};

var files = fs.readdirSync(base_dir).filter(file => { if (file.substring(0,2)==='28') {return file}});


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readSensorFile(fileName){
  return fs.readFileSync(fileName, 'utf-8').split(/\r?\n/);
}

async function readTemperatures(files) {
  var sensor = {};
  var sensors=[];
  
  for (var file of files){
    var lines = readSensorFile(base_dir+file+'/w1_slave');
    while (lines[0].substring(lines[0].length-3, lines[0].length) !== 'YES'){
      await sleep(200);
      lines = readSensorFile(base_dir+file+'/w1_slave');
    }
    
    var equals_pos = lines[1].indexOf('t=');
    if (equals_pos !== -1){
      var temp_string = lines[1].substring(equals_pos+2,lines[1].length);
      var tempC = (temp_string) / 1000.0
      sensor={sensor: file, temperature: tempC}
      sensors.push(sensor);
    }
  }
  return sensors
}



function lightLED(colour){
  switch (colour){
    case 'red':
      redLED.writeSync(1);
      blueLED.writeSync(0);
      greenLED.writeSync(0);
      break;
    case 'green':
      redLED.writeSync(0);
      blueLED.writeSync(0);
      greenLED.writeSync(1);
      break;
    case 'blue':
      redLED.writeSync(0);
      blueLED.writeSync(1);
      greenLED.writeSync(0);
      break;
    default:
      redLED.writeSync(0);
      blueLED.writeSync(0);
      greenLED.writeSync(0);
    }
  }


async function checkTemperatures(){
  while (true) {
    readTemperatures(files)
      .then(data => {
        sensorData = data;
        //for (let sensor of sensorData) {
        //  console.log("Sensor: " + sensor.sensor + " Reading: " + sensor.temperature +"C");
        //}
        if (sensorData[0].temperature > hot) {
        lightLED('red');
        } else if ((sensorData[0].temperature > cold) && (sensorData[0].temperature <= hot)) {
          lightLED('green');
        } else {
          lightLED('blue');
        }
      }
      );
    
    await sleep(1000);
  }
}
  

checkTemperatures();

//stop blinking after 5 seconds
//setTimeout(endBlink, 5000); 
