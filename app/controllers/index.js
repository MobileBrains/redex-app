// try to get a new app access token
require('oauth').appToken({ forceNew: false });

Alloy.Globals.APP.init();

require('gps_tracker').startTracking(function(response){
    console.error("index:  ", response);
});

// redirect based on login
require('oauth').validateToken({
    success: function() {
        Alloy.Globals.APP.navigatorOpen('home');
    },
    error: function(){
        Alloy.Globals.APP.navigatorOpen('login', { navigationWindow: false });
    }
});