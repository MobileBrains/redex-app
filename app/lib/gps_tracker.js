var tracking = false;
var configuredMonitoring = false;
var minUpdateDistance = 1;
var minAge = 1000;
var maxAge = 5000;
var accuracy = 10;

function requestLocationPermissions(authorizationType, callback) {
  if (Ti.Geolocation.hasLocationPermissions(authorizationType)) {
    return callback({
      success: true
    });
  }

  Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS, function(e) {
    if (!e.success) {
      return callback({
        success: false,
        error: e.error || 'Failed to request Location Permissions'
      });
    }

    callback({
      success: true
    });
  });
}

function isTracking() {
  return tracking;
}

function toggleTracking(callback) {
  if (isTracking()) {
    stopTracking(callback);
  } else {
    startTracking(callback);
  }
}

function startTracking(callback) {
  console.error("oeeeeeeeee");
  if (isTracking()) {
    return callback({
      success: false,
      error: 'Already tracking'
    });
  }

  initMonitoring(function(e) {
    if (!e.success) {
      return callback(e);
    }

    tracking = true;

    Ti.Geolocation.addEventListener('location', onLocation);

    callback({
      success: true
    });

    console.error("GPS START");
  });
}

exports.startTracking = startTracking;

function stopTracking(callback) {
  if (!isTracking()) {
    return callback({
      success: false,
      error: 'Not tracking'
    });
  }

  Ti.Geolocation.removeEventListener('location', onLocation);

  tracking = false;

  callback({
    success: true
  });

  console.error("GPS STOP");
}

exports.stopTracking = stopTracking;

function initMonitoring(callback) {

  requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS, function(e) {

    if (e.success && !configuredMonitoring) {
      Ti.Geolocation.Android.addLocationProvider(Ti.Geolocation.Android.createLocationProvider({
        name: Ti.Geolocation.PROVIDER_GPS,
        minUpdateDistance: minUpdateDistance,
        minUpdateTime: (minAge / 1000)
      }));
      Ti.Geolocation.Android.addLocationRule(Ti.Geolocation.Android.createLocationRule({
        provider: Ti.Geolocation.PROVIDER_GPS,
        accuracy: accuracy,
        maxAge: maxAge,
        minAge: minAge
      }));
      Ti.Geolocation.Android.manualMode = true;

      configuredMonitoring = true;
    }

    return callback(e);
  });
}

function onLocation(e) {

  if (!e.error) {
    var coords = e.coords;

    var data = {};

    if (coords.altitudeAccuracy !== null) {
      data.altitudeAccuracy = coords.altitudeAccuracy;
      data.altitude = coords.altitude;
    }

    ['heading', 'speed'].forEach(function(key) {
      if (coords[key] !== -1) {
        data[key] = coords[key];
      }
    });

    ['altitude', 'latitude', 'longitude', 'timestamp'].forEach(function(key) {
      data[key] = coords[key];
    });

    console.error("GPS DATA: ", data);
  }
}
