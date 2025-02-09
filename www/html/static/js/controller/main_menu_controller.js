tlcApp.controller('MainMenuController', function ($scope, $rootScope, $stateParams, tlcService, $location, $translate) {

    //console.log("main_menu_controller getTLCs");
    //tlcService.getTLCs().then(function (TLCs) {
    //    $scope.TLCs = $rootScope.getTLCsFromResponse(TLCs);
    //    $rootScope.TLCs = TLCs;
    //    window.setTimeout(changeHref, 50);
    //});

    $scope.isSelected = false;

    //var changeHref = function () {
    //    if ($('.type3').attr("href") != undefined) {
    //        var type3href = $('.type3').attr("href").slice(0, -4);
    //    }
    //
    //    type3href = type3href + "warm_up";
    //    $('.type3').attr("href", type3href);
    //};

    var menuResize = function () {
        var windowHeight = $(window).height();
        $('#main-menu').height(windowHeight);
    };

    $rootScope.layoutContent = function () {

        $('.content').height($(window).height());

        $('.content').width($(window).width() - $('.menu').width());

    };

    $rootScope.$watch(function () {
            return $location.path();
        },
        function (a) {

            var layoutTiles = function () {
                $(".tile").css({
                    'height': '100%'
                });

                $(".tile").height($(".tile").height() - ($(".tile-title").height() + 50));
            };


            if ($(window).width() < 768) {

            }
            else if ($(window).width() > 992) {
                setTimeout(layoutTiles, 0);
            }


        });

    var currentId = $stateParams["tlc_id"];


    $scope.tlcId = currentId;
    $scope.getClass = function (path) {
        if ($location.path().substr(0, path.length) == path) {


            return "subnav-selected"
        } else {
            return ""
        }
    };


    window.setTimeout($rootScope.layoutContent, 1);

    menuResize();

    $(window).on("resize", function () {
        menuResize();
        $rootScope.layoutContent();
    });

});
