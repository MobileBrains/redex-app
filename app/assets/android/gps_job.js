var moment = require('alloy/moment');

console.error("Service GPS Job ", moment().format('HH:mm:ss - MMM D, YYYY'));

require('gps_tracker').startTracking(function(response){
  console.error("Service GPS Job:  ", response);
});

require('gps_tracker').getCurrentPosition(function(e){
    console.error("GPS DATA: ", e);
    if (!e.error) {
        require('http').request({
            timeout: 10000,
            type: 'POST',
            format: 'JSON',
            oauth_type: 'userToken',
            data: {
                longitude: e.coords.longitude,
                latitude: e.coords.latitude,
                location_type: 1
            },
            url: Alloy.Globals.Secrets.backend.url + '/api/v1/users/updateLocation',
            success: function(response) {
                console.error("updateLocation response success: ", response);
            },
            failure: function(response) {
                console.error("updateLocation response error: ", response);
            }
        });
    }
});