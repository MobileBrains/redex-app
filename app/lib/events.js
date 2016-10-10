/*
 * Common JS module to help with Ti Event listener handling.
 * @author Neville Dastur
 * @url http://www.clinsoftsolutions.com
 *
 * Acknowledgements go to https://gist.github.com/minhnc/2333095 as my starting point on this
 */

exports.registerEventListener = function(obj, event, callback) {
  if ( typeof obj._eventListeners == 'undefined' ) {
		obj._eventListeners = [];
	}

	obj.addEventListener(event, callback);
	obj._eventListeners.push({event: event, callback: callback});
};

exports.unRegisterEventListeners = function(obj, event) {
	if ( typeof obj._eventListeners == 'undefined' || obj._eventListeners.length == 0 ) {
		return;
	}

	var savedListeners = obj._eventListeners;

	for(var i = 0; i < savedListeners.length; i++) {
		var e = obj._eventListeners[i];
		if (event && event !== e.event) continue;
		obj.removeEventListener(e.event, e.callback);
		savedListeners = savedListeners.splice(i, 1);
	}

	obj._eventListeners = savedListeners;
};