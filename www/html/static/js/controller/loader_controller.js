tlcApp.controller('LoaderController', function ($scope, loaderService, $timeout) {

    // Lock the ui. If true, a overlay appears and ui interactions are disabled
    $scope.lockUi = false;

    // Register an observer
    loaderService.registerObserver(function () {
        $timeout(function () {
            $scope.lockUi = Boolean(loaderService.getUiLockingProcesses().length);
        });
    })
});