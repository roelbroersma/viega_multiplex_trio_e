tlcApp.controller('SubmenuController', function ($scope, $rootScope, tlcService, $stateParams, $location) {

    var currentId = $stateParams["tlc_id"];

    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);
    });

    // Update TLC if name was updated
    $rootScope.$on('tlcUpdated', function(event, tlc) {
        $scope.TLC.name = tlc.name;
    });

    var menuResize = function () {
        var windowHeight = $(window).height();

        $('#main-menu').height(windowHeight);

    };


    var layoutNav = function () {
        var navWidth = $('.menu').width();

        $('.menu').css({
            right: "-" + navWidth + "px"
        });

    };

    var navSlideIn = function () {
        var navWidth = $('.menu').width();

        $('.menu').animate({
            right: "-" + navWidth + "px"
        }, 500, function () {
            // Animation complete.
        });
    };

    var layoutContent = function () {
        $('.content').height($(window).height());
    };


    if ($(window).width() < 768) {
        layoutNav();
    }

    $scope.isActive = function (path) {
        return $location.path().substr(0, path.length) == path;
    };

    $scope.getClass = function (path) {
        if ($scope.isActive(path)) {
            return "subnav-selected"
        } else {
            return ""
        }
    };

    menuResize();

    window.setTimeout(layoutContent, 50);

    $(window).on("resize", function () {
        menuResize();
        layoutContent();

        if ($(window).width() < 768) {
            layoutNav();
        }

    });

    $('.right-header').on("click", function () {
        navSlideIn();
    });

});