var fs = require("fs");

function readWeatherInfoFromFile(filepath) {
    var sampleWeatherDataRaw = fs.readFileSync(filepath, "utf8");
    var buffer = new Buffer(sampleWeatherDataRaw, "base64");
    var sampleWeatherData = buffer.toString();
    
    return sampleWeatherData;
}

var weatherJSON = JSON.parse(readWeatherInfoFromFile("./info.json"));

var i;
var myWeatherInfo = []
for(i = 0; i < weatherJSON.list.length; i++) {
	var info = {};
	info.mtemp = weatherJSON.list[i].main.temp;
	info.wdesc = weatherJSON.list[i].weather[0].description;
	info.atmpress = weatherJSON.list[i].main.pressure;
	info.dt_txt = weatherJSON.list[i].dt_txt;
	info.wnd = {
		v: weatherJSON.list[i].wind.speed,
		dir: weatherJSON.list[i].wind.deg
	};
	myWeatherInfo.push(info);
}

var weatherInfoCSV = myWeatherInfo.map(buildWeatherInfoCSVLine);

function buildWeatherInfoCSVLine(weather) {
	var localeTimeString = new Date(weather.dt_txt).toLocaleTimeString();
    return localeTimeString + "," + weather.mtemp + "ºC," + weather.wdesc + "\n";
}

var csvHeader = "time,temperature,description\n";

weatherInfoCSV.splice(0,0,csvHeader);

console.log("Todays weather:");
console.log(weatherInfoCSV.join(""));
