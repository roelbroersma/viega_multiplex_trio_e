tlcApp.controller('QuickBathController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, $modal, loaderService) {

    var currentId = $stateParams["tlc_id"];
    var running = false;
    var modalAllowed = true;
    var statepollActive, bathtubPollActive = false;

    $scope.quickAmount1 = undefined;
    $scope.quickAmount2 = undefined;
    $scope.quickAmount3 = undefined;

    $('.status-tile').hide();
    $('.button-overlay').hide();

    $scope.statusText = $translate.instant("PLEASE_WAIT");

    var statePoll, bathtubState;

    var ModalInstanceCtrl = function ($scope, $modalInstance) {
        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        };

    };

    var openModal = function () {
        if (modalAllowed) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'myModalContent.html',
                controller: ModalInstanceCtrl,
                resolve: {}
            });

            modalAllowed = false;
        }
    };

    var openOtherModal = function () {
        if (modalAllowed) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'myOtherModalContent.html',
                controller: ModalInstanceCtrl,
                resolve: {}
            });

            modalAllowed = false;
        }
    };

    var pollBathtubState = function () {
        if (!bathtubPollActive) {
            bathtubPollActive = true;
            tlcService.getBathtubState(currentId).then(function (state) {
                state = $rootScope.getSingleElementFromResponse(state);
                if (state.state == 2) {
                    cancelBathtubFill();
                }
                bathtubPollActive = false;
            });
        }
    };

    var pollState = function () {
        if (!statepollActive) {
            statepollActive = true;
            tlcService.getTLCState(currentId).then(function (state) {
                state = $rootScope.getSingleElementFromResponse(state);
                if (state.state != 'b' && state.state != 'h' && state.state != 'i') {
                    clearInterval(statePoll);
                    clearInterval(bathtubState);


                    cancelBathtubFill();
                    openModal();
                }

                if (state.state == 'b') {
                    $scope.statusText = $translate.instant("WATER_RUNNING");
                }
                else if (state.state == 'h') {
                    $scope.statusText = $translate.instant("BATH_CLEANING");
                }
                else if (state.state == 'i') {
                    $scope.statusText = $translate.instant("BATH_FILLING");
                }

                statepollActive = false;
            });


        }
    };

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);
        $scope.softwareVersion = $scope.TLC.version;

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout($rootScope.layoutTiles, 1);
        window.setTimeout($rootScope.layoutContent, 1);

        //if ($scope.TLC.state == 'c') {
        //    $location.path(currentId + '/warm_up');
        //}
        //else if ($scope.TLC.state == 'f' || $scope.TLC.state == 'g' || $scope.TLC.state == 'e') {
        //    $location.path(currentId + '/hygiene');
        //}
        if ($scope.TLC.state == 'h' || $scope.TLC.state == 'i') {
            running = true;
        }

        loaderService.removeProcess('TLC:LOAD');
    });

    loaderService.addProcess('TLC:SETTINGS:LOAD');
    tlcService.getTLCSettings(currentId).then(function (settings) {
        settings = $rootScope.getSingleElementFromResponse(settings);
        $scope.temp_unit = settings.temperature_unit;

        if ($scope.temp_unit == 0) {
            $rootScope.tempUnit = '°C';
        }
        else {
            $rootScope.tempUnit = '°F';
        }

        loaderService.addProcess('QUICKTEMP:1:LOAD');
        tlcService.getQuickTemp(currentId, 1).then(function (temp) {
            temp = $rootScope.getSingleElementFromResponse(temp);
            $scope.quickTemp1 = $rootScope.limitQuickTemp(temp.temperature);
            $scope.quickAmount1 = temp.amount;

            if ($scope.temp_unit == 0) {
                $scope.quickTemp1Display = $scope.quickTemp1;
            }
            else {
                $scope.quickTemp1Display = $scope.quickTemp1 * 1.8 + 32;
                $scope.quickTemp1Display = Math.round($scope.quickTemp1Display * 10) / 10;
            }
            loaderService.removeProcess('QUICKTEMP:1:LOAD');
        });

        loaderService.addProcess('QUICKTEMP:2:LOAD');
        tlcService.getQuickTemp(currentId, 2).then(function (temp) {
            temp = $rootScope.getSingleElementFromResponse(temp);
            $scope.quickTemp2 = $rootScope.limitQuickTemp(temp.temperature);
            $scope.quickAmount2 = temp.amount;

            if ($scope.temp_unit == 0) {
                $scope.quickTemp2Display = $scope.quickTemp2;
            }
            else {
                $scope.quickTemp2Display = $scope.quickTemp2 * 1.8 + 32;
                $scope.quickTemp2Display = Math.round($scope.quickTemp2Display * 10) / 10;
            }

            loaderService.removeProcess('QUICKTEMP:2:LOAD');
        });

        loaderService.addProcess('QUICKTEMP:3:LOAD');
        tlcService.getQuickTemp(currentId, 3).then(function (temp) {

            temp = $rootScope.getSingleElementFromResponse(temp);
            $scope.quickTemp3 = $rootScope.limitQuickTemp(temp.temperature);
            $scope.quickAmount3 = temp.amount;

            if ($scope.temp_unit == 0) {
                $scope.quickTemp3Display = $scope.quickTemp3;
            }
            else {
                $scope.quickTemp3Display = $scope.quickTemp3 * 1.8 + 32;
                $scope.quickTemp3Display = Math.round($scope.quickTemp3Display * 10) / 10;
            }

            if ($scope.quickAmount1 == 0 &&
                $scope.quickAmount2 == 0 &&
                $scope.quickAmount3 == 0) {
                $scope.noQAMessage = true;
            }


            if (running == true) {
                var qa = 0;

                if ($scope.quickTemp1 == $scope.TLC.required_temp) {
                    qa = 1;
                }
                else if ($scope.quickTemp2 == $scope.TLC.required_temp) {
                    qa = 2;
                }
                else if ($scope.quickTemp3 == $scope.TLC.required_temp) {
                    qa = 3;
                }


                if (qa != 0) {
                    var className = "#tile-" + qa;
                    var button = "#button-" + qa;
                    var tile = "#button-tile-" + qa;

                    $('.tile-content-white').not(tile).find('.button-overlay').show();

                    $(".bath-button").not(button).css({
                        'background-color': '#EAEAEA',
                        'cursor': 'default'
                    });

                    $scope.statusText = $translate.instant("PLEASE_WAIT");

                    $('.bath-button').text($translate.instant('FILL_BATH'));

                    $('.status-tile').hide();

                    $(button).text($translate.instant('CANCEL'));

                    $(className).show();

                    statePoll = setInterval(pollState, 1000);
                    bathtubState = setInterval(pollBathtubState, 1000);

                    $scope.bathtubFill = true;
                }

            }

            loaderService.removeProcess('QUICKTEMP:3:LOAD');
        });

        loaderService.removeProcess('TLC:SETTINGS:LOAD');
    });


    var saveRequestPending = false;
    var saveTLC = function (changedKey) {

        $scope.sendTLC = {
            "id": $scope.TLC.id,
            "name": $scope.TLC.name,
            "temperature": $scope.TLC.temperature,
            "flow": $scope.TLC.flow,
            "changed": changedKey
        };

        if (!saveRequestPending) {
            saveRequestPending = true;
            // console.log("SAVING TLC");
            tlcService.saveTLC($scope.sendTLC).then(function () {
                saveRequestPending = false;
            });
        }
    };

    var shutDownTLC = function () {

        $scope.TLC.flow = 0;
        $scope.TLC.temperature = 0;

        saveTLC(0);
    };

    var cancelBathtubFill = function () {
        $('.status-tile').hide();
        $('.bath-button').text($translate.instant('FILL_BATH'));
        $scope.bathtubFill = false;

        $('.button-overlay').hide();

        $(".bath-button").css({
            'background-color': '#9B9B9B',
            'cursor': 'pointer'
        });

        shutDownTLC();

        clearInterval(statePoll);
        clearInterval(bathtubState);
    };


    $scope.startBathtubFill = function (temp, amount, classNumber) {
        modalAllowed = true;

        var className = "#tile-" + classNumber;
        var button = "#button-" + classNumber;
        var tile = "#button-tile-" + classNumber;

        if ($(button).text() == $translate.instant('CANCEL')) {

            shutDownTLC();

            $('.status-tile').hide();
            $scope.bathtubFill = false;
            $(button).text($translate.instant('FILL_BATH'));

            $('.button-overlay').hide();

            $(".bath-button").css({
                'background-color': '#9B9B9B',
                'cursor': 'pointer'
            });

            clearInterval(statePoll);
            clearInterval(bathtubState);

            openOtherModal();

        }
        else {

            $('.tile-content-white').not(tile).find('.button-overlay').show();

            $(".bath-button").not(button).css({
                'background-color': '#EAEAEA',
                'cursor': 'default'
            });

            $scope.statusText = $translate.instant("PLEASE_WAIT");

            $('.bath-button').text($translate.instant('FILL_BATH'));

            $('.status-tile').hide();

            $(className).show();

            $(button).text($translate.instant('CANCEL'));

            var object = {
                "temperature": temp,
                "amount": amount
            };

            tlcService.startBathtubFill(currentId, object);

            statePoll = setInterval(pollState, 1000);
            bathtubState = setInterval(pollBathtubState, 1000);

            $scope.bathtubFill = true;
        }


    };

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });


});