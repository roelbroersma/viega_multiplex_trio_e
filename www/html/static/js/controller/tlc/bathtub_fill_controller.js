tlcApp.controller('BathtubFillController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, $modal, loaderService, $timeout) {

    var currentId = $stateParams["tlc_id"];
    var actTemp;
    var actFlow;
    var modalAllowed = true;
    $('.wheel-button').hide();
    var displayVisible = false;
    var statePoll, bathtubState;
    $scope.statusText = "";
    $scope.tlcState = "";
    $('.value-display').hide();
    var tempStart = 4;
    var tempEnd = 80;
    var tempStep = 0;
    var statepollActive, bathtubPollActive, popupPollActive = false;
    var lastState = null;
    $scope.wheelReady = false;

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {

        $scope.TLC = $rootScope.getTLCFromResponse(TLC);
        $scope.maximalAmount = 1000.0;
        if ($scope.TLC.max_amount) {
            $scope.maximalAmount = parseInt($scope.TLC.max_amount, 10) / 10; // dl to liter
        }

        $scope.testFlow = 30;

        $scope.bathtubFill = false;

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout(layoutTlcController, 1);
        window.setTimeout($rootScope.layoutTiles, 1);

        loaderService.addProcess('QUICKTEMP:LOAD');
        tlcService.getQuickTemp(currentId, 1).then(function (temp) {
            temp = $rootScope.getSingleElementFromResponse(temp);
            $scope.quickTemp1 = $rootScope.limitQuickTemp(temp.temperature);
            $scope.amount = temp.amount;

            if ($scope.quickTemp1 == 0) {
                $scope.quickTemp1 = 50;
            }

            if ($scope.amount == 0) {
                $scope.amount = 100;
            }

            $scope.amountDisplay = $scope.amount;
            $scope.fillTemp = $scope.quickTemp1;

            tlcService.getTLCSettings(currentId).then(function (settings) {
                settings = $rootScope.getSingleElementFromResponse(settings);
                $scope.temp_unit = settings.temperature_unit;
                $scope.scald = settings.scald_temp;


                if ($scope.scald != undefined) {
                    tempEnd = $scope.scald;
                }


                if ($scope.temp_unit == 0) {
                    $scope.tempDisplay = Math.round($scope.fillTemp * 2) / 2;
                    $rootScope.tempUnit = '°C';
                }
                else {
                    $scope.tempDisplay = (Math.round($scope.fillTemp * 2) / 2) * 1.8 + 32;
                    $rootScope.tempUnit = '°F';
                }

                tlcService.getTLCState(currentId).then(function (state) {
                    state = $rootScope.getSingleElementFromResponse(state);
                    $scope.set_temp = $rootScope.limitQuickTemp(state.set_temperature);
                    if (state.set_temperature != 0) {
                        $scope.fillTemp = $scope.set_temp;
                        if ($scope.temp_unit == 0) {
                            $scope.tempDisplay = Math.round($scope.fillTemp * 2) / 2;
                            $rootScope.tempUnit = '°C';
                        }
                        else {
                            $scope.tempDisplay = (Math.round($scope.fillTemp * 2) / 2) * 1.8 + 32;
                            $rootScope.tempUnit = '°F';
                        }
                    }

                    if ($scope.TLC.state == 'b' || $scope.TLC.state == 'h' || $scope.TLC.state == 'i') {

                        var temp = $scope.set_temp;

                        $scope.bathtubFill = true;
                        $scope.fillTemp = $scope.set_temp;

                        statePoll = setInterval(pollState, 1000);
                        bathtubState = setInterval(pollBathtubState, 1000);

                        var colorArray = getColorArray(temp);

                        tempColor = getHexColorFromColor(colorArray);

                        $('.tile').css({
                            'background-color': tempColor
                        });


                        $('.wheel-button').css({
                            'background-color': tempColor
                        });

                        displayVisible = true;

                    }

                    //if ($scope.TLC.state == 'c') {
                    //    $location.path(currentId + '/warm_up');
                    //}
                    //else if ($scope.TLC.state == 'f' || $scope.TLC.state == 'g' || $scope.TLC.state == 'e') {
                    //    $location.path(currentId + '/hygiene');
                    //}
                    $scope.wheelReady = true;
                    window.setTimeout(layoutTlcController, 1);
                    loaderService.removeProcess('QUICKTEMP:LOAD');
                });

                $('.value-display').show();
            });

        });

        loaderService.removeProcess('TLC:LOAD');
    });

    var ModalInstanceCtrl = function ($scope, $modalInstance) {
        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        };

    };

    var openCancelModal = function () {

        // Use timeout to prevent automatic closing
        // of the dialog on mobile devices
        $timeout(function() {
            if (modalAllowed) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'myOtherModalContent.html',
                    controller: ModalInstanceCtrl,
                    resolve: {},
                    keyboard: false
                });

                modalAllowed = false;
            }
        }, 1);
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


    var pollBathtubState = function () {
        if (!bathtubPollActive) {
            bathtubPollActive = true;
            tlcService.getBathtubState(currentId).then(function (state) {
                state = $rootScope.getSingleElementFromResponse(state);
                if (state.state == 2) {
                    //cancelBathtubFill();
                }
                bathtubPollActive = false;
            });
        }

        if (!popupPollActive) {
            popupPollActive = true;
            tlcService.getPopUpState(currentId).then(function (popupState) {
                $scope.popupOpen = false;
                popupState = $rootScope.getSingleElementFromResponse(popupState);
                if (popupState.state == 1) {
                    $scope.popupOpen = true;
                }
                popupPollActive = false;
            });
        }
    };


    var pollState = function () {
        if (!statepollActive) {
            statepollActive = true;
            tlcService.getTLCState(currentId).then(function (state) {

                // Abort response processing if user stopped the filling process
                if(!$scope.bathtubFill) {
                    statepollActive = false;
                    return;
                }

                state = $rootScope.getSingleElementFromResponse(state);
                $scope.tlcState = state.state;

                if (state.state != 'b' && state.state != 'h' && state.state != 'i') {
                    cancelBathtubFill();

                    clearInterval(statePoll);
                    clearInterval(bathtubState);

                    $scope.statusText = "";

                    openModal();
                }

                if ($scope.landscape == true) {

                    if (state.state == 'h') {
                        $scope.statusText = $translate.instant("BATH_CLEANING");
                    }
                    else if (state.state == 'i') {
                        $scope.statusText = $translate.instant("BATH_FILLING_LONG");
                    }

                    var windowHeight = $('.tile').height();

                }
                else {
                    if (state.state == 'h') {
                        $scope.statusText = $translate.instant("BATH_CLEANING");
                    }
                    else if (state.state == 'i') {
                        $scope.statusText = $translate.instant("BATH_FILLING_LONG");
                    }
                }

                // Update temperature on first state change to filling
                if(lastState !== null && lastState.state !== state.state && state.state === 'i') {
                    saveTLC(1);
                }

                statepollActive = false;
                lastState = state;
            });
        }
    };


    tlcService.getQuickTemp(currentId, 2).then(function (temp) {
        temp = $rootScope.getSingleElementFromResponse(temp);
        $scope.quickTemp2 = $rootScope.limitQuickTemp(temp.temperature);
    });

    tlcService.getQuickTemp(currentId, 3).then(function (temp) {
        temp = $rootScope.getSingleElementFromResponse(temp);
        $scope.quickTemp3 = $rootScope.limitQuickTemp(temp.temperature);
    });


    var cancelBathtubFill = function () {
        $scope.bathtubFill = false;
        $scope.statusText = "";

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

        $('.tile').css({
            'background-color': tempColor
        });

        $('.wheel-button').css({
            'background-color': "#969696"
        });

        clearInterval(statePoll);
        clearInterval(bathtubState);

        $scope.tlcState = 'a';

    };

    $scope.$watch('regulatorMode', function (newValue, oldValue) {
        $scope.flowActive = newValue;
        if (newValue == undefined) {
            $scope.flowActive = false;
        }
    });

    $scope.togglePopup = function () {
        $scope.popupOpen = !$scope.popupOpen;
        var popupState = 0;
        if ($scope.popupOpen) {
            popupState = 1;
        }
        var state = {'state': popupState};
        tlcService.savePopUpState($scope.TLC.id, state);
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


    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });

    tlcService.getPopUpState(currentId).then(function (popupState) {
        $scope.popupOpen = false;
        popupState = $rootScope.getSingleElementFromResponse(popupState);
        if (popupState.state == 1) {
            $scope.popupOpen = true;
        }
    });

    var valueDisplay, timeOut;
    var clickCount = 0;

    function resetClickCount() {
        clickCount = 0;

        displayVisible = !displayVisible;
    }

    var startBathtubFill = function () {
        statePoll = setInterval(pollState, 1000);
        bathtubState = setInterval(pollBathtubState, 1000);

        $scope.$apply(function () {
            $scope.bathtubFill = true;
        });

        var object = {
            "temperature": $scope.fillTemp,
            "amount": $scope.amount
        };

        tlcService.startBathtubFill(currentId, object);

    };


    $(window).on('resize', function () {
        layoutTlcController();
    });

    function layoutTlcController() {
        $rootScope.tlc_base_layout();

    }


    $rootScope.$watch(function () {
            return $location.path();
        },
        function (a) {

        });

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

    var clockWise = true;
    var prevAngle, flowPrevActive, dragging, dragStartVal, dragEndVal;
    var tempColor = '#000000';
    var draggedAngle = 0;


    function wheelClicked() {
        if ($scope.wheelReady) {
            modalAllowed = true;

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

            if ($scope.bathtubFill == true) {
                displayVisible = !displayVisible;
                cancelBathtubFill();

                clearInterval(statePoll);
                clearInterval(bathtubState);

                $scope.statusText = "";

                openCancelModal();
            }
            else {
                startBathtubFill();

                if ($scope.temp_unit == 0) {
                    $scope.tempDisplay = Math.round($scope.fillTemp * 2) / 2;
                    $rootScope.tempUnit = '°C';
                }
                else {
                    $scope.tempDisplay = (Math.round($scope.fillTemp * 2) / 2) * 1.8 + 32;
                    $rootScope.tempUnit = '°F';
                }

                var colorArray = getColorArray($scope.fillTemp);
                tempColor = getHexColorFromColor(colorArray);


                $('.tile').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });

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

            if ($scope.fillTemp >= 45 && clockWise) {
                // + 2.5°C per full circle
                tempStep = $rootScope.calcStep(prevAngle, this.angle, 2.5);
            } else {
                // +/- 10°C per full circle
                tempStep = $rootScope.calcStep(prevAngle, this.angle, 10);
            }

            if (clockWise == true) {
                $scope.fillTemp += tempStep;
            } else {
                $scope.fillTemp -= tempStep;
            }

            $scope.fillTemp = $rootScope.limitTemp($scope.fillTemp, tempStart, tempEnd);

            $scope.$apply(function () {
                $scope.fillTemp = Math.ceil($scope.fillTemp * 1000) / 1000;
                if ($scope.temp_unit == 0) {
                    $scope.tempDisplay = Math.round($scope.fillTemp * 2) / 2;
                    $rootScope.tempUnit = '°C';
                }
                else {
                    $scope.tempDisplay = (Math.round($scope.fillTemp * 2) / 2) * 1.8 + 32;
                    $rootScope.tempUnit = '°F';
                }
            });

            prevAngle = this.angle;

            $scope.TLC.temperature = $scope.fillTemp.toFixed(1);

            if ($scope.bathtubFill == true) {
                var colorArray = getColorArray($scope.fillTemp);
                tempColor = getHexColorFromColor(colorArray);


                $('.tile').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });

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

    var oldAngle = 0;
    var newAngle = 0;
    var angleDiff;

    var flowPropellerOptions = {
        inertia: 0,

        onRotate: function () {
            newAngle = this.angle;
            angleDiff = newAngle - oldAngle;

            if (typeof angleDiff != 'number' || angleDiff > 300 || angleDiff < -300) {
                angleDiff = 0;
            }

            oldAngle = this.angle;

            if (this.angle - prevAngle > -100 && this.angle - prevAngle < 100) {
                if (this.angle < prevAngle) {
                    clockWise = false;
                }
                if (this.angle > prevAngle) {
                    clockWise = true;
                }
            }

            angleDiff = angleDiff * (Math.PI / 180);


            if (clockWise == true) {
                $scope.testFlow += 0.5;
            }
            else {
                $scope.testFlow += 0.5;
            }
            if (clockWise == true) {
                $scope.amount = $scope.amount + (($scope.amount * angleDiff) / (3 * Math.PI));
            }
            else {
                $scope.amount = $scope.amount + (($scope.amount * angleDiff) / (3 * Math.PI));
            }
            if ($scope.amount < 10.0 || $scope.amount > $scope.maximalAmount) {
                if ($scope.amount < 10.0) {
                    $scope.amount = 10.0;
                }
                else {
                    $scope.amount = $scope.maximalAmount;
                }
            }
            $scope.$apply(function () {
                $scope.amount = Math.ceil($scope.amount * 1000) / 1000;
                $scope.amountDisplay = Math.round($scope.amount * 2) / 2;
            });

            prevAngle = this.angle;

        },
        onDragStart: function () {
            dragStartVal = $scope.testFlow;

            // Abort rotating if filling is active
            if($scope.bathtubFill) {
                this.stop();
            }
        },
        onDragStop: function () {
            dragEndVal = $scope.testFlow;

            if (dragStartVal - dragEndVal > 0.01 || dragEndVal - dragStartVal > 0.01) {
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