const unirest = require("unirest");
const moment = require("moment");
const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
        console.log("Event Today reached");

        let unirestReq = unirest("GET", "https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events?calendarId=indark%40lehigh.edu&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-06T00%3A00%3A00-04%3A00&timeMax=2018-05-15T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs");

        unirestReq.headers({
            "Cache-Control": "no-cache"
        });
        unirestReq.end(function (result) {
            if (result.error) throw new Error(result.error);
            console.log(result.body);
            //let events = [];
            console.log(moment(Date.now()));
            const threeDaysFromNow = moment(Date.now()).add(4,'d');
            const aWeekFromNow = moment(Date.now()).add(7,'d');
            const threeDay = result.body.items.map(event => {
                const dateTime = event.start.dateTime;
                const eventName = event.summary;
                console.log('moment : ' + moment(dateTime).fromNow() + " " + moment(dateTime).isAfter(Date.now()) + " " + moment(dateTime).isBefore(threeDaysFromNow));
                if(moment(dateTime).isAfter(Date.now())) {
                    //events[i] = {"dateTime": dateTime};
                    if (moment(dateTime).isBefore(threeDaysFromNow)) {
                        const eventMoment = moment(dateTime);
                        const eventString = eventName + " on " + eventMoment.format("dddd, MMMM Do");
                        return eventString;
                    }
                }
            });
            console.log("EVENTS ARRAY");
            //console.log(events);
            console.log("3 DAY ARRAY");
            const filteredThreeDay = threeDay.filter(arr => arr);
            console.log(filteredThreeDay);
            res.json({
                fulfillment_text: filteredThreeDay.join(', ')
            });
        });

        console.log("Does this reach")


    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
