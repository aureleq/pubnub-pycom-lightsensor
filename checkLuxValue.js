// This Function checks lux value on the channel lighting
//
// A counter is incremented is value > 10 is detected.
// After 5 consecutives high values, a new message containing the clientId is published on lightingAlerts channel

export default (request) => {

  // Import modules ‘console’ {to display variables for troubleshooting) and ‘kvstore’ (to use the KV store)
  var console = require("console");
  var db = require("kvstore");
  var pubnub = require("pubnub");


  try {

    var highLux = 10;
    var counterMax = 5;

    //request.message = JSON.parse(request.message);

    console.log("The message " + JSON.stringify(request.message) + " was published on " + request.channels[0] + " via " + request.meta.clientip);


    // Retrieve the key-value pair highLux
    return db.getCounter("highLux").then(function (counter) {

        console.log("counter", counter);

        // increase counter if high lux value detected
        if(request.message.luxValue > highLux) {
            db.incrCounter("highLux");
            console.log("High lux value detected");
        }
        else {
            db.incrCounter("highLux", -counter); // reset counter
            console.log("Low lux value detected, removing counter");
        }

        // max consecutive values reach
        // publishing alert on channel lightingAlerts
        if(counter >= counterMax) {
            console.log(counterMax + " high lux in a row, send alert");
            db.incrCounter("highLux", -counter);

            var alertMessage = { "clientId": request.message.clientId };

            pubnub.publish({
                "channel": "lightingAlerts",
                "message": alertMessage
            }).then((publishResponse) => {
                console.log(`Publish Status: ${publishResponse[0]}:${publishResponse[1]} with TT ${publishResponse[2]}`);
            });

        }

        return request.ok();

    });


    // Handle error
  } catch (e) {
    console.error("Uncaught exception:", e);
  }
};
