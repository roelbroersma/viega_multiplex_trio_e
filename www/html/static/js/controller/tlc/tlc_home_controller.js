tlcApp.controller('TLCHomeController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, loaderService) {

    var currentId = $stateParams["tlc_id"];
    var actTemp;
    var actFlow;
    var statePoll;
    $('.wheel-button').hide();
    var colorArray;

    $('.value-display').hide();

    $scope.amountLabel = 'L';

    var displayVisible = false;

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);

        // TODO: check TLC not null

        if ($scope.TLC.type == 3) {
            $location.path('/' + currentId + "/warm_up");
        }

        actTemp = $scope.TLC.temperature;
        actFlow = $scope.TLC.flow;
        $scope.flowActive = false;

        $scope.currentTemp = actTemp;
        $scope.currentFlow = actFlow;

        $scope.TLC.temperature = actTemp;
        $scope.TLC.flow = actFlow;
        $scope.is_tlc_temperature = $scope.TLC.is_tlc_temperature;

        $scope.testFlow = $scope.currentFlow;
        $scope.currentFlowPercentage = $scope.currentFlow * 100;

        $scope.temp_sensor = $scope.TLC.temperatur_sensor;

        $scope.state = $scope.TLC.state;

        //if ($scope.TLC.state == 'c') {
        //    $location.path(currentId + '/warm_up');
        //}
        //else if ($scope.TLC.state == 'f' || $scope.TLC.state == 'g' || $scope.TLC.state == 'e') {
        //    $location.path(currentId + '/hygiene');
        //}

        loaderService.addProcess('TLC:SETTINGS:LOAD');
        tlcService.getTLCSettings(currentId).then(function (settings) {
            settings = $rootScope.getSingleElementFromResponse(settings);
            $scope.temp_unit = settings.temperature_unit;


            if ($scope.temp_unit == 0) {
                $scope.tempDisplay = Math.round($scope.currentTemp * 2) / 2;
                $rootScope.tempUnit = '°C';
            }
            else {
                $scope.tempDisplay = (Math.round($scope.currentTemp * 2) / 2) * 1.8 + 32;
                $rootScope.tempUnit = '°F';
            }

            $('.value-display').show();

            loaderService.removeProcess('TLC:SETTINGS:LOAD');
        });


        if ($scope.TLC.state == 'b') {

            //Choose if required Temp is set or use IS temp & flow from tlc
            var temp = 0.0;
            var flow = 0.0;

            if ($scope.TLC.required_temp != undefined) {
                temp = $scope.TLC.required_temp;
            } else {
                temp = actTemp;
            }

            if ($scope.TLC.required_flow != undefined) {
                flow = $scope.TLC.required_flow;
            } else {
                flow = actFlow;
            }

            $scope.currentTemp = temp;
            $scope.selectionActive = !$scope.selectionActive;


            if ($scope.temp_unit == 0) {
                $scope.tempDisplay = Math.round($scope.currentTemp * 2) / 2;
                $rootScope.tempUnit = '°C';
            }
            else {
                $scope.tempDisplay = (Math.round($scope.currentTemp * 2) / 2) * 1.8 + 32;
                $rootScope.tempUnit = '°F';
            }


            $scope.currentFlow = Math.ceil(flow * 10000) / 10000;
            $scope.currentFlowPercentage = flow * 100;

            displayVisible = true;

            statePoll = setInterval(pollState, 1000);
            colorArray = getColorArray(temp);
            tempColor = getHexColorFromColor(colorArray);


            $('#temp-tile').css({
                'background-color': tempColor
            });

            $('.flow-bar').css({
                'background-color': tempColor
            });

            $('.wheel-button').css({
                'background-color': tempColor
            });

            var barHeight = Math.round($scope.currentFlow * 100);

            $('.flow-bar').css({
                'height': barHeight + "%"
            });
        }

        loaderService.addProcess('TLC:POPUPSTATE:LOAD');
        tlcService.getPopUpState(currentId).then(function (popupState) {
            $scope.popupOpen = false;
            popupState = $rootScope.getSingleElementFromResponse(popupState);
            if (popupState.state == 1) {
                $scope.popupOpen = true;
            }
            loaderService.removeProcess('TLC:POPUPSTATE:LOAD');
        });

        window.setTimeout($rootScope.layoutContent, 50);
        window.setTimeout(layoutTlcController, 50);
        window.setTimeout($rootScope.layoutTiles, 50);

        loaderService.removeProcess('TLC:LOAD');
    });

    tlcService.getQuickTemp(currentId, 1).then(function (temp) {
        temp = $rootScope.getSingleElementFromResponse(temp);
        $scope.quickTemp1 = $rootScope.limitQuickTemp(temp.temperature);
        $scope.quickFlow1 = temp.flow;
    });

    tlcService.getQuickTemp(currentId, 2).then(function (temp) {
        temp = $rootScope.getSingleElementFromResponse(temp);
        $scope.quickTemp2 = $rootScope.limitQuickTemp(temp.temperature);
        $scope.quickFlow2 = temp.flow;
    });

    tlcService.getQuickTemp(currentId, 3).then(function (temp) {
        temp = $rootScope.getSingleElementFromResponse(temp);
        $scope.quickTemp3 = $rootScope.limitQuickTemp(temp.temperature);
        $scope.quickFlow3 = temp.flow;
    });

    $scope.reload = function () {
        location.reload();
    };
    var saveRequestPending = false;

    $scope.togglePopup = function () {
        $scope.popupOpen = !$scope.popupOpen;
        var popupState = 0;
        if ($scope.popupOpen) {
            popupState = 1;
        }
        var state = {'state': popupState};

        tlcService.savePopUpState($scope.TLC.id, state);
    };

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

    var pollState = function () {
        tlcService.getTLCState(currentId).then(function (state) {
            state = $rootScope.getSingleElementFromResponse(state);
            if (state.state != 'b') {
                displayVisible = false;
                $scope.selectionActive = false;
                clearInterval(statePoll);

                shutDownTLC();

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

                $('.flow-bar').css({
                    'height': "0%"
                });

                $('.wheel-button').css({
                    'background-color': "#969696"
                });

                clickCount = 0;
            }
        });
    };


    $scope.$watch('regulatorModeSelect', function (newValue, oldValue) {
        $scope.flowActive = newValue;
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

    $scope.selectionActive = false;
    var tempStart = 4;
    var tempEnd = 80;
    var tempStep = 0;

    var clockWise = true;
    var prevAngle, flowPrevActive, dragging, dragStartVal, dragEndVal;

    var tempColor = '#000000';

    var clickCount = 0;
    var timeOut, wheelBind;
    var draggedAngle = 0;

    function resetClickCount() {
        clickCount = 0;
    }

    var handleClick = 'ontouchend' in document.documentElement ? 'touchend' : 'click';

    function wheelClicked() {
        if (angular.isValue($scope.TLC) && angular.isValue($scope.quickTemp1) && angular.isValue($scope.quickTemp2) && angular.isValue($scope.quickTemp3)) {
            $scope.$apply(function () {
                $scope.selectionActive = !$scope.selectionActive;
            });

            clickCount++;

            if (clickCount == 1) {

                $scope.currentTemp = $scope.quickTemp1;
                $scope.TLC.temperature = $scope.currentTemp;

                $scope.currentFlow = $scope.quickFlow1;

                if ($scope.currentFlow > 1) {
                    $scope.currentFlow = 1;
                }

                $scope.TLC.flow = $scope.currentFlow;

                $scope.$apply(function () {
                    if ($scope.temp_unit == 0) {
                        $scope.tempDisplay = Math.round($scope.currentTemp * 2) / 2;
                        $rootScope.tempUnit = '°C';
                    }
                    else {
                        $scope.tempDisplay = (Math.round($scope.currentTemp * 2) / 2) * 1.8 + 32;
                        $rootScope.tempUnit = '°F';
                    }
                    $scope.currentFlow = Math.ceil($scope.currentFlow * 10000) / 10000;
                    $scope.currentFlowPercentage = $scope.currentFlow * 100;
                });

                var buttonTop = $('.wheel-button').css("top").slice(0, -2);
                var valueDisplay;

                buttonTop = +buttonTop;

                if ($(window).width() > 922) {
                    valueDisplay = 0;
                }
                else {
                    valueDisplay = 0;
                }
                var top;
                if (displayVisible == false) {
                    top = buttonTop - valueDisplay;
                }
                else {
                    top = (buttonTop + valueDisplay);
                }

                $('.wheel-button').css({
                    'top': top
                });

                if (displayVisible == false) {

                    timeOut = setTimeout(resetClickCount, 600, true);

                    saveTLC(1);
                    statePoll = setInterval(pollState, 1000);
                    colorArray = getColorArray($scope.currentTemp);
                    tempColor = getHexColorFromColor(colorArray);

                    $('#temp-tile').css({
                        'background-color': tempColor
                    });

                    $('.flow-bar').css({
                        'background-color': tempColor
                    });

                    $('.wheel-button').css({
                        'background-color': tempColor
                    });

                    var barHeight = Math.round($scope.currentFlow * 100);

                    $('.flow-bar').css({
                        'height': barHeight + "%"
                    });

                    var temp = {
                        "temperature": $scope.currentTemp,
                        "flow": $scope.currentFlow
                    };

                    tlcService.sendQuickTemp(currentId, 1);


                }
                else {

                    clearInterval(statePoll);

                    shutDownTLC();

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

                    $('.flow-bar').css({
                        'height': "0%"
                    });

                    $('.wheel-button').css({
                        'background-color': "#969696"
                    });

                    clickCount = 0;

                }

                displayVisible = !displayVisible;
            }
            else if (clickCount == 2) {
                $scope.$apply(function () {
                    $scope.selectionActive = !$scope.selectionActive;
                });

                $scope.currentTemp = $scope.quickTemp2;
                $scope.TLC.temperature = $scope.currentTemp;
                if ($scope.temp_unit == 0) {
                    $scope.tempDisplay = Math.round($scope.currentTemp * 2) / 2;
                    $rootScope.tempUnit = '°C';
                }
                else {
                    $scope.tempDisplay = (Math.round($scope.currentTemp * 2) / 2) * 1.8 + 32;
                    $rootScope.tempUnit = '°F';
                }

                $scope.currentFlow = $scope.quickFlow2;
                $scope.TLC.flow = $scope.currentFlow;

                $scope.currentFlow = Math.ceil($scope.currentFlow * 10000) / 10000;
                $scope.currentFlowPercentage = $scope.currentFlow * 100;

                tlcService.sendQuickTemp(currentId, 2);

                colorArray = getColorArray($scope.currentTemp);

                tempColor = getHexColorFromColor(colorArray);


                $('#temp-tile').css({
                    'background-color': tempColor
                });

                $('.flow-bar').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });
            }
            else if (clickCount == 3) {
                $scope.$apply(function () {
                    $scope.selectionActive = !$scope.selectionActive;
                });

                $scope.currentTemp = $scope.quickTemp3;
                $scope.TLC.temperature = $scope.currentTemp;
                if ($scope.temp_unit == 0) {
                    $scope.tempDisplay = Math.round($scope.currentTemp * 2) / 2;
                    $rootScope.tempUnit = '°C';
                }
                else {
                    $scope.tempDisplay = (Math.round($scope.currentTemp * 2) / 2) * 1.8 + 32;
                    $rootScope.tempUnit = '°F';
                }

                $scope.currentFlow = $scope.quickFlow3;
                $scope.TLC.flow = $scope.currentFlow;

                $scope.currentFlow = Math.ceil($scope.currentFlow * 10000) / 10000;
                $scope.currentFlowPercentage = $scope.currentFlow * 100;


                tlcService.sendQuickTemp(currentId, 3);

                colorArray = getColorArray($scope.currentTemp);

                tempColor = getHexColorFromColor(colorArray);


                $('#temp-tile').css({
                    'background-color': tempColor
                });

                $('.flow-bar').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });

                clickCount = 0;

                clearTimeout(timeOut);
            }
        }
    }

    var tempPropellerOptions = {
        inertia: 0,
        onRotate: function () {
            if (this.angle >= prevAngle) {
                clockWise = true;
            } else {
                clockWise = false;
            }
            draggedAngle = draggedAngle + $rootScope.deltaAngle(prevAngle, this.angle);

            if ($scope.currentTemp >= 45 && clockWise) {
                // + 2.5°C per full circle
                tempStep = $rootScope.calcStep(prevAngle, this.angle, 2.5);
            } else {
                // +/- 10°C per full circle
                tempStep = $rootScope.calcStep(prevAngle, this.angle, 10);
            }

            if ($scope.selectionActive == true) {
                if (clockWise == true) {
                    $scope.currentTemp += tempStep;
                } else {
                    $scope.currentTemp -= tempStep;
                }

                $scope.currentTemp = $rootScope.limitTemp($scope.currentTemp, tempStart, tempEnd);

                $scope.$apply(function () {
                    $scope.currentTemp = Math.ceil($scope.currentTemp * 1000) / 1000;
                    if ($scope.temp_unit == 0) {
                        $scope.tempDisplay = Math.round($scope.currentTemp * 2) / 2;
                        $rootScope.tempUnit = '°C';
                    }
                    else {
                        $scope.tempDisplay = (Math.round($scope.currentTemp * 2) / 2) * 1.8 + 32;
                        $rootScope.tempUnit = '°F';
                    }
                });

                prevAngle = this.angle;
                colorArray = getColorArray($scope.currentTemp);
                tempColor = getHexColorFromColor(colorArray);

                $('#temp-tile').css({
                    'background-color': tempColor
                });

                $('.flow-bar').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });

                $scope.TLC.temperature = $scope.currentTemp.toFixed(1);
                $scope.TLC.flow = $scope.currentFlow.toFixed(2);

                saveTLC(1);

            }


        },
        onDragStart: function () {
            dragging = true;
            draggedAngle = 0;
        },
        onDragStop: function () {
            dragging = draggedAngle > 1;
            if (!dragging) {
                wheelClicked();
            }
        }
    };

    var flowPropellerOptions = {
        inertia: 0,

        onRotate: function () {
            if (this.angle < prevAngle) {
                clockWise = false;
            }
            if (this.angle > prevAngle) {
                clockWise = true;
            }

            if (clockWise == true) {
                $scope.testFlow += 0.5;
            }
            else {
                $scope.testFlow -= 0.5;
            }

            if ($scope.selectionActive == true) {

                if (clockWise == true) {
                    $scope.currentFlow += 0.007;
                }
                else {
                    $scope.currentFlow -= 0.007;

                }
                if ($scope.currentFlow < 0.05 || $scope.currentFlow > 1.0) {
                    if ($scope.currentFlow < 0.05) {
                        $scope.currentFlow = 0.05;
                    }
                    else {
                        $scope.currentFlow = 1.0;
                    }
                }
                $scope.$apply(function () {
                    $scope.currentFlow = Math.ceil($scope.currentFlow * 10000) / 10000;
                    $scope.currentFlowPercentage = $scope.currentFlow * 100;
                });
                prevAngle = this.angle;

                var barHeight = Math.round($scope.currentFlow * 100);

                $('.flow-bar').css({
                    'height': barHeight + "%"
                });

                $scope.TLC.temperature = $scope.currentTemp.toFixed(1);
                $scope.TLC.flow = $scope.currentFlow.toFixed(2);

                saveTLC(2);

            }
        },
        onDragStart: function () {
            dragStartVal = $scope.testFlow;
        },
        onDragStop: function () {
            dragEndVal = $scope.testFlow;

            if (dragStartVal - dragEndVal > 0.1 || dragEndVal - dragStartVal > 0.1) {
                dragging = true;
            }
            else {
                dragging = false;
                wheelClicked();
            }


        }
    };


    $('#temp .wheel-interface').propeller(tempPropellerOptions);
    $('#flow .wheel-interface').propeller(flowPropellerOptions);
});