tlcApp.controller('PasswordController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, $parse, loaderService) {

    var currentId = $stateParams["tlc_id"];
    $scope.passwordEnabled = false;

    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);
        $scope.softwareVersion = $scope.TLC.version;

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout($rootScope.layoutTiles, 1);

        //if ($scope.TLC.state == 'b') {
        //    $location.path(currentId + '/home');
        //}
        //else if ($scope.TLC.state == 'c') {
        //    $location.path(currentId + '/warm_up');
        //}
        //else if ($scope.TLC.state == 'f' || $scope.TLC.state == 'g' || $scope.TLC.state == 'e') {
        //    $location.path(currentId + '/hygiene');
        //}
        //else if ($scope.TLC.state == 'h') {
        //    $location.path(currentId + '/bathtub_fill');
        //}

    });

    loaderService.addProcess('TLC:SETTINGS:LOAD');
    tlcService.getTLCSettings(currentId).then(function (settings) {
        $scope.settings = $rootScope.getSingleElementFromResponse(settings);
         if ($scope.settings.passwordSet == true) {
            $scope.passwordEnabled = $scope.passwordEnable = true;
        }

        loaderService.removeProcess('TLC:SETTINGS:LOAD');
    });

    window.setTimeout($rootScope.layoutContent, 1);

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });

    $scope.$watch('passwordEnable', function (newValue, oldValue) {
        if (newValue != undefined && $scope.settings != undefined && oldValue != undefined) {
            $scope.passwordEnabled = $scope.settings.passwordSet = newValue;

            tlcService.saveTLCSettings($scope.settings).then(function () {
                if ($scope.settings.passwordSet == true) {
                    if (window.location.href.indexOf("https") == -1) {
                        window.location = window.location.href.replace("http", "https");
                    }
                    else {
                        window.location.reload();
                    }
                }
            });
        }
    });

    $scope.savePassword = function () {
        var username = $('#username').val();
        var password = $('#password-first').val();
        var password_repeat = $('#password-repeat').val();

        if (password == password_repeat) {
            var login = {
                'username': username,
                'password': password
            };

            tlcService.savePassword(currentId, login).then(function () {
                $scope.passwordMatch = true;
                setTimeout(function () {
                    window.location.reload();
                }, 1000)
            });
        }
        else {
            $scope.passwordMatch = false;
        }
    }


});