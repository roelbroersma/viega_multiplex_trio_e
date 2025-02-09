tlcApp.controller('HygieneController', function ($scope, $rootScope, tlcService, $stateParams, $translate, loaderService) {

    var currentId = $stateParams["tlc_id"], statePoll;
    $scope.disinfectionRunning = false;
    $scope.countDownTime = "";
    $scope.finish_failed = false;
    $scope.flushActive = false;

    var bgColorSuccess = '#99CC00',
        bgColor = '#E5877E',
        setProgress = function (progress, bgColor) {
            var delta = 100 - (progress * 100);
            $(".disinfection-status").css({
                'right': delta + "%",
                'background-color': bgColor
            });
            $(".disinfection-message").css({
                left: delta + "%"
            });
        },
        disinfectionSuccess = function() {
            clearInterval(statePoll);
            setProgress(1, bgColorSuccess);
            $scope.countDownTime = $translate.instant("THERMAL_DESINFECTION_FINISHED");
            $scope.finish_failed = true;
        },
        disinfectionFailed = function() {
            clearInterval(statePoll);
            setProgress(1, bgColor);
            $scope.countDownTime = $translate.instant("THERMAL_DESINFECTION_FAILED");
            $scope.finish_failed = true;
        };

    var pollState = function () {
        tlcService.getTLCState(currentId).then(function (state) {
            state = $rootScope.getSingleElementFromResponse(state);
            if (state.state === 'g') {
                disinfectionFailed();
            }
            else if (state.state === 'e') {
                disinfectionSuccess();
            }
            else {
                setProgress(state.progress, bgColor);
            }
        });
    };

    $scope.startDisinfection = function () {
        $scope.disinfectionRunning = true;

        tlcService.startDesinfection(currentId);

        statePoll = setInterval(pollState, 1000);
    };

    $scope.saveHygiene = function () {
        tlcService.setHygieneDetail($scope.hygiene);
    };

    $('.disinfection-container').css({
        'background-image':"url('"+$rootScope.routePrefix+"/static/img/tlc_bacterias.png')"
    });

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);

        if ($scope.TLC.state === 'g') {
            disinfectionFailed();
        }
        else if ($scope.TLC.state === 'e') {
            disinfectionSuccess();
        }

        loaderService.removeProcess('TLC:LOAD');
    });

    loaderService.addProcess('TLC:STATE:LOAD');
    tlcService.getTLCState(currentId).then(function (state) {
        state = $rootScope.getSingleElementFromResponse(state);
        // var progress = state.progress;
        if (state.progress != 0) {
            $scope.disinfectionRunning = true;

            statePoll = setInterval(pollState, 1000);

            setProgress(state.progress, bgColor);
        }
        loaderService.removeProcess('TLC:STATE:LOAD');
    });

    loaderService.addProcess('HYGIENEDETAIL:LOAD');
    tlcService.getHygieneDetail(currentId).then(function (hygiene) {
        $scope.hygiene = $rootScope.getSingleElementFromResponse(hygiene);
        $scope.flushActive = $scope.hygiene.hygiene_flush_active;
        $scope.hygieneFlushActive = $scope.flushActive;
        $scope.repetitionperiod = $scope.hygiene.repetition_period;
        $scope.flushDuration = $scope.hygiene.flush_duration;

        if ($scope.flushActive == false) {
            $scope.repetitionperiod = 7;
            $scope.flushDuration = 10;
        }

        if ($scope.flushDuration == 60) {
            $scope.durationLabel = "1 min";
        }
        else if ($scope.flushDuration == 300) {
            $scope.durationLabel = "5 min";
        }
        else if ($scope.flushDuration == 600) {
            $scope.durationLabel = "10 min";
        }
        else {
            $scope.durationLabel = $scope.flushDuration + " s";
        }

        if ($scope.repetitionperiod == 1) {
            $scope.repetitionperiodLabel = $scope.repetitionperiod + " "+$translate.instant("DAY");
        }
        else {
            $scope.repetitionperiodLabel = $scope.repetitionperiod + " "+$translate.instant("DAYS");
        }

        $scope.flushDurationSeconds = $scope.hygiene.flush_duration;

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout($rootScope.layoutTiles, 1)

        loaderService.removeProcess('HYGIENEDETAIL:LOAD');
    });

    window.setTimeout($rootScope.layoutContent, 1);

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });

    $scope.setRepetitionPeriod = function (period) {
        $scope.hygiene.repetition_period = period;
        $scope.saveHygiene();
        $scope.repetitionperiod = $scope.hygiene.repetition_period;

        if ($scope.repetitionperiod == 1) {
            $scope.repetitionperiodLabel = $scope.repetitionperiod + " "+$translate.instant("DAY");
        }
        else {
            $scope.repetitionperiodLabel = $scope.repetitionperiod + " "+$translate.instant("DAYS");
        }
    };

    $scope.setFlushDuration = function (duration) {
        $scope.hygiene.flush_duration = duration;
        $scope.flushDuration = $scope.hygiene.flush_duration;

        $scope.saveHygiene();

        if (duration == 60) {
            $scope.durationLabel = "1 min";
        }
        else if (duration == 300) {
            $scope.durationLabel = "5 min";
        }
        else if (duration == 600) {
            $scope.durationLabel = "10 min";
        }
        else {
            $scope.durationLabel = duration + " s";
        }
    };

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

    window.onbeforeunload = function () {
        shutDownTLC();
        clearInterval(statePoll);
    };

    $scope.$watch('hygieneFlushActive', function (newValue, oldValue) {
        if (newValue != undefined && oldValue != undefined) {
            $scope.flushActive = newValue;
            $scope.hygiene.hygiene_flush_active = $scope.flushActive;
            $scope.hygiene.repetition_period = $scope.repetitionperiod;
            $scope.hygiene.flush_duration = $scope.flushDuration;
            $scope.saveHygiene();
        }
    });

    $scope.reload = function () {
        window.location.reload();
    };

    $scope.cancelDisinfection = function () {
        $scope.disinfectionRunning = false;

        tlcService.cancelDesinfection(currentId).then(function () {
            window.location.reload();
        });
    };

    $('.tile').on("scroll", function () {
        $('input').toggleClass('force-redraw');
    });

    $scope.okPressed = function () {
        tlcService.cancelDesinfection(currentId).then(function () {
            shutDownTLC();
            $scope.disinfectionRunning = false;
            window.location.reload();
        });
    }

});