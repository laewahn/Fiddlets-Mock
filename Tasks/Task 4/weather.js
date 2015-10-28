var fs = require("fs");

function readWeatherInfoFromFile(filepath) {
    var sampleWeatherDataRaw = fs.readFileSync(filepath, "utf8");
    var buffer = new Buffer(sampleWeatherDataRaw, "base64");
    var sampleWeatherData = buffer.toString();
    
    return sampleWeatherData;
}

function convertToWeatherInfo(weatherList) {
	var i;
	var myWeatherInfo = []
	for(i = 0; i < weatherList.length; i++) {
		var info = {};
		info.mtemp = weatherList[i].main.temp;
		info.wdesc = weatherList[i].weather[0].description;
		info.atmpress = weatherList[i].main.pressure;
		info.dt_txt = weatherList[i].dt_txt;
		info.wnd = {
			v: weatherList[i].wind.speed,
			dir: weatherList[i].wind.deg
		};
		myWeatherInfo.push(info);
	}

	return myWeatherInfo;
}
var weatherData = readWeatherInfoFromFile("./info.dat");
var weatherJSON = JSON.parse(weatherData);
var weatherList = weatherJSON.list;
var weatherInfo = convertToWeatherInfo(weatherList);
exportWeather(weatherInfo);

function exportWeather(info) {
    function buildWeatherInfoCSVLine(weather) {
    	return weather;
	}

	var weatherInfoCSV = info.map(buildWeatherInfoCSVLine);	
	fs.writeFile("forecast.csv", weatherInfoCSV.join(""), function(err) {
    
    if(err) {
        console.error(err);
    }
});
}



