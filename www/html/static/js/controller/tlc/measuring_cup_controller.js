tlcApp.controller('MeasuringCupController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, loaderService) {

    var currentId = $stateParams["tlc_id"];
    var actTemp;
    var actFlow;
    var fillPoll, statePoll;
    var pollCounter = 0;
    $('.wheel-button').hide();
    var tempColor = '#000000';
    var saveRequestPending = false;

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);

        loaderService.addProcess('MEASUREINGCUPVALUE:LOAD');
        tlcService.getMeassureingCupValue(currentId).then(function (value) {
            value = $rootScope.getSingleElementFromResponse(value);
            $scope.fillAmount = value.amount;

            if ($scope.fillAmount >= 0.95) {
                $scope.amountLabel = "L";
                $scope.fillAmount = Math.ceil($scope.fillAmount * 1000) / 1000;
                $scope.tempDisplay = $scope.fillAmount;
            }
            else {
                $scope.amountLabel = "dl";
                $scope.fillAmount = Math.ceil($scope.fillAmount * 1000) / 1000;
                $scope.tempDisplay = Math.round($scope.fillAmount * 10);
            }

            loaderService.removeProcess('MEASUREINGCUPVALUE:LOAD');
        });

        $scope.testTemp = 30;
        $scope.waterRunning = false;

        //if ($scope.TLC.state == 'b') {
        //    $location.path(currentId + '/home');
        //}
        //else if ($scope.TLC.state == 'f' || $scope.TLC.state == 'g' || $scope.TLC.state == 'e') {
        //    $location.path(currentId + '/hygiene');
        //}
        //else if ($scope.TLC.state == 'h') {
        //    $location.path(currentId + '/bathtub_fill');
        //}
        if ($scope.TLC.state == 'i') {
            tempColor = "#2E64FE";

            $('#temp-tile').css({
                'background-color': tempColor
            });

            $('.wheel-button').css({
                'background-color': tempColor
            });

            $scope.waterRunning = false;
        }

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout(layoutTlcController, 1);
        window.setTimeout($rootScope.layoutTiles, 1);

        loaderService.removeProcess('TLC:LOAD');
    });

    function saveMeasuringCupValue(amount) {
        var data = {
            'amount': amount
        };

        if (!saveRequestPending) {
            saveRequestPending = true;
            tlcService.saveMeassureingCupValue(currentId, data).then(function () {
                saveRequestPending = false;
            });
        }


    }

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

    var pollFillStatus = function () {

        if (pollCounter < 3) {
            tlcService.getMeassureingCupState($scope.TLC.id).then(function (fill) {
                fill = $rootScope.getSingleElementFromResponse(fill);
                if (fill && fill.state == 2) {
                    cancelFill();
                }
            });
        }
        else {
            pollCounter = 0;
            cancelFill();
        }

        if ($rootScope.isTest) {
            pollCounter++;
        }
    };

    var pollState = function () {
        tlcService.getTLCState(currentId).then(function (state) {
            state = $rootScope.getSingleElementFromResponse(state);

        });
    };

    var startFill = function () {
        $scope.waterRunning = true;

        var quantity = Math.round($scope.fillAmount * 10) / 10;

        var temp = {"quantity": quantity};

        tlcService.startMeassureingCup($scope.TLC.id, temp).then(function () {

        });

        fillPoll = setInterval(pollFillStatus, 1000);
        statePoll = setInterval(pollState, 1000);


    };

    var cancelFill = function () {
        $scope.waterRunning = false;


        shutDownTLC();

        tempColor = "#EAEAEA";
        $('#temp-tile').css({
            'background-color': tempColor
        });
        $('.wheel-button').css({
            'background-color': "#969696"
        });

        clearInterval(fillPoll);
        clearInterval(statePoll);
    };


    $rootScope.$watch(function () {
            return $location.path();
        },
        function (a) {
            if ($scope.TLC != undefined) {
                cancelFill();
            }

        });


    window.onbeforeunload = function () {
        cancelFill();
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

    var tempStart = 0.5;
    var tempEnd = 100;
    var clockWise = true;
    var prevAngle, flowPrevActive, dragging, dragStartVal, dragEndVal;

    var displayVisible = false;


    $('.temp .wheel-interface').on('click', function (evt) {
        if (dragging == true || !angular.isValue($scope.TLC)) {

        }
        else {
            if ($scope.waterRunning == false) {

                tempColor = "#2E64FE";

                $('#temp-tile').css({
                    'background-color': tempColor
                });

                $('.wheel-button').css({
                    'background-color': tempColor
                });

                startFill();
            }
            else {
                tempColor = "#EAEAEA";


                cancelFill();
            }
            displayVisible = !displayVisible;
        }
    });

    var oldAngle = 0;
    var newAngle = 0;
    var angleDiff;

    var tempPropellerOptions = {

        inertia: 0,
        onRotate: function () {
            if (this.angle < prevAngle) {
                clockWise = false;
            }
            if (this.angle > prevAngle) {
                clockWise = true;
            }

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

            if ($scope.waterRunning == false) {
                if (clockWise == true) {
                    $scope.fillAmount = $scope.fillAmount + (($scope.fillAmount * angleDiff) / (3 * Math.PI));
                }
                else {
                    $scope.fillAmount = $scope.fillAmount + (($scope.fillAmount * angleDiff) / (3 * Math.PI));
                }
            }

            if (clockWise == true) {
                $scope.testTemp += 0.5;
            }
            else {
                $scope.testTemp += 0.5;
            }
            if ($scope.fillAmount < tempStart || $scope.fillAmount > tempEnd) {
                if ($scope.fillAmount < tempStart) {
                    $scope.fillAmount = tempStart;
                }
                else {
                    $scope.fillAmount = tempEnd;
                }
            }
            $scope.$apply(function () {
                if ($scope.fillAmount >= 0.95) {
                    $scope.amountLabel = "L";
                    $scope.fillAmount = Math.ceil($scope.fillAmount * 1000) / 1000;
                    $scope.tempDisplay = $scope.fillAmount;
                }
                else {
                    $scope.amountLabel = "dl";
                    $scope.tempDisplay = Math.round($scope.fillAmount * 10);
                }
            });

            saveMeasuringCupValue($scope.fillAmount);

            prevAngle = this.angle;

        },
        onDragStart: function () {
            dragStartVal = $scope.testTemp;
        },
        onDragStop: function () {
            dragEndVal = $scope.testTemp;

            if (dragStartVal - dragEndVal > 0.1 || dragEndVal - dragStartVal > 0.1) {
                dragging = true;
            }
            else {
                dragging = false;
            }
        }
    };


    $('#temp .wheel-interface').propeller(tempPropellerOptions);
});