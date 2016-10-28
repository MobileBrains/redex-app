exports.appToken = function(args) {

    if (!args.forceNew) {
        var appAccessToken = Ti.App.Properties.getString("app_access_token", null);

        if (appAccessToken !== null) {
            if (args.callback) {
                args.callback(appAccessToken);
            }
            return;
        }
    }

    var clientId     = Alloy.Globals.Secrets.backend.client_id;
    var clientSecret = Alloy.Globals.Secrets.backend.client_secret;
    var baseUrl      = Alloy.Globals.Secrets.backend.url;

    require("http").request({
        timeout: 10000,
        type: "POST",
        format: "JSON",
        url: baseUrl + "/oauth/token",
        data: {
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret
        },
        success: function(response) {
            Ti.App.Properties.setString("app_access_token", response.access_token);

            if (args.callback) {
                args.callback(response.access_token);
            }
            return;
        }
    });
};
