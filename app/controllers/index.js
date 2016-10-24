// try to get a new app access token
require("oauth").appToken();

require("core").init();

/**
 * Global Navigation Handler
 */
Alloy.Globals.Navigator = {

    /**
     * Handle to the Navigation Controller
     */
    navGroup: $.navigationWindow,

    open: function(controller, payload){
        var win = Alloy.createController(controller, payload || {}).getView();

        if( OS_IOS ) {
            this.navGroup.openWindow(win);
        } else {
            win.open();
        }
    }
};

if (OS_IOS) {
    $.navigationWindow.open();
} else if ( OS_ANDROID ) {
    $.home.getView().open();
}
