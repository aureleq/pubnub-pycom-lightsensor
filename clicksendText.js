export default (request) => {

    // require console module for logging to console
    const console = require('console');
    const pubnub = require('pubnub');

    // require xhr
    const xhr = require('xhr');
    const auth = require('codec/auth');

    // your clicksend api key
    const apiUsername = '';
    const apiKey = '';

    // api endpoint
    const apiUrl = 'https://rest.clicksend.com/v3/sms/send';

    // destination phone number
    const phoneNumber = '';


    const channel = request.channels[0];

    // require for unit tests only
    const responseChannel = channel + '-response';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: auth.basic(apiUsername, apiKey)
        },
        body: JSON.stringify({messages: [{
            source: "blocks",
            body: "Alert received from " + request.message.clientId,
            from: "clicksend",
            to: phoneNumber
        }]})

    };


    // create a HTTP POST request to the sendgrid API
    return xhr.fetch(apiUrl, options).then((r) => {
        console.log(r);

        let testResponse = 0;
        if (r.status == 200) {
            testResponse = 1;
        }
        pubnub.publish({
            channel: responseChannel,
            message: testResponse
        });
        return request.ok()
    })
    .catch(e => {
        console.error(e);
        pubnub.publish({
            channel: responseChannel,
            message: 0
        });
        return request.ok();
    });
};
