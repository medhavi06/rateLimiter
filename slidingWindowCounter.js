var redis = require('redis');
var redisClient = redis.createClient();

module.exports = (req,res,next) => {
    redisClient.get(req.headers.user,(err,redisResponse) => {
        if(err){
            console.log("Problem with redis");
            system.exit(0);
        }
        if(redisResponse) {
            let data = JSON.parse(redisResponse);
            let d = new Date();
            let currentTime = d.getTime();
            let aMinuteAgo = currentTime - 6000;
            console.log("currentTime : "+currentTime+" aMinuteAgo : "+aMinuteAgo);

            let RequestCountPerMinutes = data.filter((item) => {
                console.log(item);
                if(item.requestTime < aMinuteAgo)
                {
                    data.shift();
                    console.log("shifted the data "+item.counter);
                }
                return item.requestTime > aMinuteAgo;
            })

            let thresHold = 0;

            RequestCountPerMinutes.forEach((item) => {
                thresHold = thresHold + item.counter;
                console.log("increased thresHold, counter is "+ item.counter);
            })
            if(thresHold >= 3){
                return res.json({ "error" : 1,"message" : "throttle limit exceeded" })
            }
            else{
                let isFound = false;
                data.forEach(element => {
                    if(element.requestTime) {
                        isFound = true;
                        element.counter++;
                    }
                    console.log("found it. Threshold is "+thresHold);
                });
                if(!isFound){
                    data.push({
                        requestTime : currentTime,
                        counter : 1
                    })
                    console.log("pushing...");
                }
                redisClient.set(req.headers.user,JSON.stringify(data));
                next();
            }
        }
        else{
            let data = [];
			let d = new Date();
            let requestData = {
                'requestTime' : d.getTime(),
                'counter' : 1
            }
            data.push(requestData);
            redisClient.set(req.headers.user,JSON.stringify(data));
			console.log("first time entry");
            next();
        }
    })
}