function buildGreeting(name) {
	var greeting = "Hello" + name;
	return greeting;
}

var namesString = "Alice,Bob,Charles";
var names = namesString.split(",");
var greetings = names.map(buildGreeting);

console.log(greetings);