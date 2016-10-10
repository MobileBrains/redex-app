/**
 * The main app singleton used throughout the app. This object contains static
 * properties, global event handling, etc.
 *
 * @class core
*/

var APP = {
    /**
     * Application ID
     * @type {String}
     */
    ID: null,
    /**
     * Application version
     * @type {String}
     */
    VERSION: null,
    /**
     * Legal information
     * @type {Object}
     * @param {String} COPYRIGHT Copyright information
     * @param {String} TOS Terms of Service URL
     * @param {String} PRIVACY Privacy Policy URL
     */
    LEGAL: {
        COPYRIGHT: null,
        TOS: null,
        PRIVACY: null
    },
    /**
     * Application settings as defined in JSON configuration file
     * @type {Object}
     * @param {String} share The share text
     * @param {Object} notifications Push notifications options
     * @param {Boolean} notifications.enabled Whether or not push notifications are enabled
     * @param {String} notifications.provider Push notifications provider
     * @param {String} notifications.key Push notifications key
     * @param {String} notifications.secret Push notifications secret
     * @param {Object} colors Color options
     * @param {String} colors.primary The primary color
     * @param {String} colors.secondary The secondary color
     * @param {String} colors.theme The theme of the primary color, either 'light' or 'dark'
     * @param {Object} colors.hsb The HSB values of the primary color
     */
    Settings: null,
    /**
     * Device information
     * @type {Object}
     * @param {Boolean} isHandheld Whether the device is a handheld
     * @param {Boolean} isTablet Whether the device is a tablet
     * @param {String} type The type of device, either 'handheld' or 'tablet'
     * @param {String} os The name of the OS, either 'IOS' or 'ANDROID'
     * @param {String} name The name of the device, either 'IPHONE', 'IPAD' or the device model if Android
     * @param {String} version The version of the OS
     * @param {Number} versionMajor The major version of the OS
     * @param {Number} versionMinor The minor version of the OS
     * @param {Number} width The width of the device screen
     * @param {Number} height The height of the device screen
     * @param {Number} dpi The DPI of the device screen
     * @param {String} orientation The device orientation, either 'LANDSCAPE' or 'PORTRAIT'
     * @param {String} statusBarOrientation A Ti.UI orientation value
     */
    Device: {
        isHandheld: Alloy.isHandheld,
        isTablet: Alloy.isTablet,
        type: Alloy.isHandheld ? 'handheld' : 'tablet',
        os: null,
        name: null,
        version: Ti.Platform.version,
        versionMajor: parseInt(Ti.Platform.version.split('.')[0], 10),
        versionMinor: parseInt(Ti.Platform.version.split('.')[1], 10),
        width: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformWidth,
        height: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight,
        dpi: Ti.Platform.displayCaps.dpi,
        orientation: Ti.Gesture.orientation == Ti.UI.LANDSCAPE_LEFT || Ti.Gesture.orientation == Ti.UI.LANDSCAPE_RIGHT ? 'LANDSCAPE' : 'PORTRAIT',
        statusBarOrientation: null
    },
    /**
     * Network status and information
     * @type {Object}
     * @param {String} type Network type name
     * @param {Boolean} online Whether the device is connected to a network
     */
    Network: {
        type: Ti.Network.networkTypeName,
        online: Ti.Network.online
    },
    /**
     * Global reference to stack of contexts
     */
    ContextStack: [],
    /**
     * Global reference to stack of app messages
     */
    MessagesStack: [],

    SavedScreens: {},
    CurrentPersistenScreen: null,

    /**
     * Initializes the application
     */
    init: function(mainWindow, mainWrapper) {
        Ti.API.debug('APP.init');

        // Global system Events
        Ti.Network.addEventListener('change', APP.networkObserver);
        //Ti.Gesture.addEventListener('orientationchange', APP.orientationObserver);
        //Ti.App.addEventListener('pause', APP.exitObserver);
        //Ti.App.addEventListener('close', APP.exitObserver);
        //Ti.App.addEventListener('resumed', APP.resumeObserver);

        /*
        if(OS_ANDROID) {
            APP.MainWindow.addEventListener('androidback', APP.backButtonObserver);
        }*/

        // Determine device characteristics
        APP.determineDevice();

        // APP.addContext(mainWindow, mainWrapper);
        // APP.openCurrentWindow();

        if ( !APP.Network.online) {
            Alloy.createController('network_lost');
            return;
        }
    },

    androidBack: function(window, callback) {
        if (OS_ANDROID && callback) {
            window.addEventListener('android:back', function(e) {
                return callback();
            });
        }
    },

    /**
    * Global network event handler
    * @param {Object} _event Standard Titanium event callback
    */
    networkObserver: function(_event) {
        Ti.API.debug('>>>>>>>>>>>> APP.networkObserver: ' + JSON.stringify(_event));

        APP.Network.type = _event.networkTypeName;
        APP.Network.online = _event.online;

        if ( !Ti.Network.online && Ti.Network.networkTypeName == 'NONE') {
            Alloy.Globals.LO.hide();
            Alloy.createController('network_lost');
        }
    },

    /**
     * Determines the device characteristics
     */
    determineDevice: function() {
        if(OS_IOS) {
            APP.Device.os = 'IOS';

            if(Ti.Platform.osname.toUpperCase() == 'IPHONE') {
                APP.Device.name = 'IPHONE';
            } else if(Ti.Platform.osname.toUpperCase() == 'IPAD') {
                APP.Device.name = 'IPAD';
            }
        } else if(OS_ANDROID) {
            APP.Device.os = 'ANDROID';

            APP.Device.name = Ti.Platform.model.toUpperCase();

            // Fix the display values
            APP.Device.width = (APP.Device.width / (APP.Device.dpi / 160));
            APP.Device.height = (APP.Device.height / (APP.Device.dpi / 160));
        }
    },

    addContext: function(_window, _wrapper){
        APP.ContextStack.push({
            window: _window,
            wrapper: _wrapper,
            screen_ctlr: null,
            screen: null,
            vars: {}
        });
    },

    dropCurrentContext: function(animated){
        var currentContext = APP.ContextStack.pop();

        // close current window
        if (currentContext !== undefined) {
            if ( currentContext.screen_ctlr && currentContext.screen_ctlr.teardown ) {
                currentContext.screen_ctlr.teardown();
            }


            if ( OS_IOS ) {
                var animClose = Ti.UI.createAnimation({
                    left: '100%',
                    duration: 300,
                    opacity: 0,
                });
                currentContext.window.close(animClose);
            }

            if ( OS_ANDROID ) {
                currentContext.window.close({animated: animated||false});
            }

            // currentContext.window.close();

            currentContext.window = null;
            currentContext.wrapper = null;
            currentContext.screen_ctlr = null;
            currentContext.screen = null;
            currentContext.vars = null;
            currentContext = null;
        }
    },

    /**
     * Remove all contexts from stack but current
     */
    dropStackedContexts: function(){
        var currentContext = APP.getCurrentContext(),
            stackLength = APP.ContextStack.length;

        if (currentContext !== undefined && stackLength > 1) {
            // iterate and close windows on stacked contexts
            for (var i = 0; i < (stackLength-1); i++) {
                var ctx = APP.ContextStack[i];

                if ( ctx.screen_ctlr && ctx.screen_ctlr.teardown ) {
                    ctx.screen_ctlr.teardown();
                }

                ctx.window.close({animated: false});
                ctx.window = null;
                ctx.wrapper = null;
                ctx.screen_ctrl = null;
                ctx.screen = null;
                ctx.vars = null;
            }

            APP.ContextStack = [currentContext];
        }
    },

    updateCurrentContext: function(_window, _wrapper){
        APP.dropCurrentContext();
        APP.addContext(_window, _wrapper);
    },

    /**
     * current context is the last element in the contexts stacks
     */
    getCurrentContext: function(){
        return APP.ContextStack[ APP.ContextStack.length - 1 ];
    },


    getCurrentWindow: function(){
        var currentContext = APP.getCurrentContext() || {};
        return currentContext.window;
    },

    openCurrentWindow: function(animated) {
        var currentWindow = APP.getCurrentWindow();
        if ( OS_IOS ) {
            currentWindow.open({
                // left: 0,
                opacity: 1.0,
                duration: 300
            });
        }else if ( OS_ANDROID ) {
            if (animated === true) {
                currentWindow.open({
                    activityEnterAnimation: Ti.Android.R.anim.slide_in_left,
                    activityExitAnimation: Ti.Android.R.anim.slide_out_right
                });
            } else {
                currentWindow.open();
            }

        }
    },
    getCurrentWrapper: function(){
        var currentContext = APP.getCurrentContext() || {};
        return currentContext.wrapper;
    },

    openScreen: function(_controller, _params){
        var currentContext = APP.getCurrentContext(),
            _screenController = Alloy.createController(_controller, _params),
            _screen = _screenController.getView();

        if ( OS_ANDROID ) {
            function buildPostLayoutEvt(_screenUI) {
                return function() {
                    require('events').unRegisterEventListeners(_screenUI);
                    Ti.UI.Android.hideSoftKeyboard();
                };
            }

            require('events').registerEventListener(
                _screen,
                'postlayout',
                buildPostLayoutEvt(
                    _screen
                )
            );
        }

        currentContext.wrapper.add(_screen);

        if( currentContext.screen !== null ){
            currentContext.wrapper.remove(currentContext.screen);

            if ( currentContext.screen_ctlr && currentContext.screen_ctlr.teardown ) {
                currentContext.screen_ctlr.teardown();
            }

            currentContext.screen = null;
            currentContext.screen_ctlr = null;
        }

        currentContext.screen_ctlr = _screenController;
        currentContext.screen = _screen;

        return _screenController;
    },

    closeCurrentScreen: function(){
        var currentContext = APP.getCurrentContext();
        if( currentContext.screen !== null ){
            currentContext.wrapper.remove(currentContext.screen);

            if ( currentContext.screen_ctlr && currentContext.screen_ctlr.teardown ) {
                currentContext.screen_ctlr.teardown();
            }

            currentContext.screen = null;
            currentContext.screen_ctlr = null;
        }
    },

    // TODO: call controller.teardown function
    openModalScreen: function(_controller, _params){
        var currentContext = APP.getCurrentContext(),
            _screenController = Alloy.createController(_controller, _params),
            _screen = _screenController.getView();

        currentContext.wrapper.add(_screen);

        return _screen;
    },

    // TODO: call controller.teardown function
    closeModalScreen: function(_modal_screen){
        var currentContext = APP.getCurrentContext();
        if(currentContext) {
            currentContext.wrapper.remove(_modal_screen);
            _modal_screen = null;
        }
    },

    contextGet: function(name){
        var context = APP.getCurrentContext();
        if(context) {
            return context.vars[name];
        }
    },

    contextSet: function(name, value){
        var context = APP.getCurrentContext();
        if(context) context.vars[name] = value;
    },

    /**
     * Save a message in the stack for later consumption
     */
    saveMessage: function(message){
        APP.MessagesStack.push(message);
    },

    /**
     * Sequencially show all messages in the stack
     * This operation also flush the stack
     */
    consumeMessages: function(){
        var message = APP.MessagesStack.shift();
        if ( message ) {
            message.consume = true;
            Alloy.createController('app_messages/message', message);
        }
    },

    openPersistentScreen: function(controllerName, args) {

        var _screenController = null;

        if (controllerName == APP.CurrentPersistenScreen) { return; }
        APP.CurrentPersistenScreen = controllerName;

        if (APP.SavedScreens[controllerName] != null) {

            Ti.API.debug('Saved instance for ' + controllerName);

            _screenController = APP.SavedScreens[controllerName];

            var currentContext = APP.getCurrentContext(),
                _screen = _screenController.getView();

            currentContext.wrapper.add(_screen);

            if( currentContext.screen !== null ){
                currentContext.wrapper.remove(currentContext.screen);

                if ( currentContext.screen_ctlr && currentContext.screen_ctlr.teardown ) {
                    currentContext.screen_ctlr.teardown();
                }

                currentContext.screen = null;
                currentContext.screen_ctlr = null;
            }

            currentContext.screen_ctlr = _screenController;
            currentContext.screen = _screen;

            if (_screenController.performUpdate) {
                _screenController.performUpdate();
            }

            return _screenController;
        }

        Ti.API.debug('First instance for ' + controllerName);
        _screenController = APP.openScreen(controllerName, args);
        APP.SavedScreens[controllerName] = _screenController;

        return _screenController;
    }
};

module.exports = APP;
