tlcApp.controller('WarmUpController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, $timeout, loaderService) {

    var currentId = $stateParams["tlc_id"];
    var actTemp;
    var actFlow;
    var warmupPoll, statePoll;
    $('.wheel-button').hide();
    $('.value-display').hide();

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);

        $scope.warmupTemp = 25;

        loaderService.addProcess('TLC:SETTINGS:LOAD');
        tlcService.getTLCSettings(currentId).then(function (settings) {
            settings = $rootScope.getSingleElementFromResponse(settings);
            $scope.temp_unit = settings.temperature_unit;

            if ($scope.temp_unit == 0) {
                $scope.tempDisplay = Math.round($scope.warmupTemp * 2) / 2;
                $rootScope.tempUnit = '°C';
            }
            else {
                $scope.tempDisplay = (Math.round($scope.warmupTemp * 2) / 2) * 1.8 + 32;
                $rootScope.tempUnit = '°F';
            }

            $('.value-display').show();

            loaderService.removeProcess('TLC:SETTINGS:LOAD');
        });

        $scope.warmUpRunning = false;

        if ($scope.TLC.state == 'c') {
            $scope.warmupTemp = $scope.TLC.required_temp;
            $scope.warmUpRunning = true;

            var windowHeight = $('.tile').height();

            var colorArray = getColorArray($scope.warmupTemp);
            tempColor = getHexColorFromColor(colorArray);

            $('#temp-tile').css({
                'background-color': tempColor
            });

            $('.wheel-button').css({
                'background-color': tempColor
            });
        }

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout(layoutTlcController, 50);
        window.setTimeout($rootScope.layoutTiles, 1);

        loaderService.removeProcess('TLC:LOAD');
    });

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });

    $(window).on('resize', function () {
        layoutTlcController();
    });

    function layoutTlcController() {
        $rootScope.tlc_base_layout();
    }

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

    var pollWarmUpStatus = function () {
        tlcService.getWarmUpState($scope.TLC.id).then(function (warmUp) {
            warmUp = $rootScope.getSingleElementFromResponse(warmUp);
            if (warmUp.state == 2) {
                cancelWarmUp();
            }
        });
    };

    var pollState = function () {
        tlcService.getTLCState(currentId).then(function (state) {
            state = $rootScope.getSingleElementFromResponse(state);
        });
    };

    var startWarmUp = function () {

        $scope.warmUpRunning = true;

        $scope.$apply(function () {
            $scope.warmUpRunning = $scope.warmUpRunning;
        });

        var windowHeight = $('.tile').height();

        var temp = {"temperature": $scope.warmupTemp};

        tlcService.startWarmUp($scope.TLC.id, temp).then(function () {

        });

        warmupPoll = setInterval(pollWarmUpStatus, 1000);
        $timeout(function () {
            statePoll = setInterval(pollState, 1000);
        }, 500);

    };

    var cancelWarmUp = function () {
        $scope.warmUpRunning = false;

        shutDownTLC();

        tempColor = "#EAEAEA";
        $('#temp-tile').css({
            'background-color': tempColor
        });
        $('.wheel-button').css({
            'background-color': "#969696"
        });

        clearInterval(warmupPoll);
        clearInterval(statePoll);
    };


    $rootScope.$watch(function () {
            return $location.path();
        },
        function (a) {
            if ($scope.TLC != undefined) {
                cancelWarmUp();
            }

        });


    window.onbeforeunload = function () {
        cancelWarmUp();
    };

    $('.wheel-button img').on('dragstart', function (event) {
        event.preventDefault();
    });

    // prevent zoom on double click
    var lastTouchStart = 0;
    $('.wheel-button img').on('touchstart', function (event) {
        var now = (new Date()).getTime(), delta = now - lastTouchStart;
        if (now - lastTouchStart <= 600) {
            event.preventDefault();
        }
        lastTouchStart = now;
    });

    var tempStart = 4;
    var tempEnd = 45; // max for shower
    var tempStep = 0;
    var clockWise = true;
    var prevAngle, flowPrevActive, dragging, dragStartVal, dragEndVal;
    var tempColor = '#000000';
    var displayVisible = false;
    var draggedAngle = 0;

    $('.temp .wheel-interface').on('click', function (evt) {
        if (dragging == true || !angular.isValue($scope.TLC)) {

        }
        else {
            if ($scope.warmUpRunning == false) {

                var colorArray = getColorArray($scope.warmupTemp);
                tempColor = getHexColorFromColor(colorArray);


                $('#temp-tile').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });


                startWarmUp();
            }
            else {
                tempColor = "#EAEAEA";

                $('.temp-slider').css({
                    'background-color': '#9B9B9B'
                });

                $('.bootstrap-switch').css({
                    'border-color': '#9B9B9B'
                });

                $('.mode-selection span').css({
                    'color': '#9B9B9B'
                });

                $('.value-display').css({
                    'color': '#9B9B9B'
                });

                $('.bootstrap-switch-label').css({
                    'background-color': tempColor
                });

                $('#temp-tile').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': "#969696"
                });


                cancelWarmUp();
            }
            displayVisible = !displayVisible;
        }
    });

    var tempPropellerOptions = {
        inertia: 0,
        onRotate: function () {
            if (this.angle >= prevAngle) {
                clockWise = true;
            } else {
                clockWise = false;
            }
            draggedAngle = draggedAngle + $rootScope.deltaAngle(prevAngle, this.angle);

            if ($scope.warmupTemp >= 45 && clockWise) {
                // + 2.5°C per full circle
                tempStep = $rootScope.calcStep(prevAngle, this.angle, 2.5);
            } else {
                // +/- 10°C per full circle
                tempStep = $rootScope.calcStep(prevAngle, this.angle, 10);
            }

            if ($scope.warmUpRunning == false) {
                // only change temp if not already warming up
                if (clockWise == true) {
                    $scope.warmupTemp += tempStep;
                } else {
                    $scope.warmupTemp -= tempStep;
                }
            }

            $scope.warmupTemp = $rootScope.limitTemp($scope.warmupTemp, tempStart, tempEnd);

            $scope.$apply(function () {
                $scope.warmupTemp = Math.ceil($scope.warmupTemp * 100) / 100;
                if ($scope.temp_unit == 0) {
                    $scope.tempDisplay = Math.round($scope.warmupTemp * 2) / 2;
                    $rootScope.tempUnit = '°C';
                }
                else {
                    $scope.tempDisplay = (Math.round($scope.warmupTemp * 2) / 2) * 1.8 + 32;
                    $rootScope.tempUnit = '°F';
                }
            });

            prevAngle = this.angle;

        },
        onDragStart: function () {
            dragging = true;
            draggedAngle = 0;
        },
        onDragStop: function () {
            dragging = draggedAngle > 1;
        }
    };

    $('#temp .wheel-interface').propeller(tempPropellerOptions);

});